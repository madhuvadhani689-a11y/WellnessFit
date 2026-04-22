const nodemailer = require("nodemailer");
const User = require("../models/User");
const PCODLog = require("../models/PCODLog");

const DAY_MS = 864e5;

const remindersEnabled = () =>
  String(process.env.PERIOD_REMINDERS_ENABLED || "false").toLowerCase() === "true";

const smtpConfigured = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
};

const whatsappConfigured = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM);
};

const normalizeWhatsAppAddress = (raw) => {
  const value = String(raw || "").trim();
  if (!value) return null;

  const withoutPrefix = value.startsWith("whatsapp:") ? value.slice("whatsapp:".length) : value;
  const compact = withoutPrefix.replace(/[^\d+]/g, "");
  if (!compact) return null;

  const e164 = compact.startsWith("00")
    ? `+${compact.slice(2)}`
    : compact.startsWith("+")
      ? compact
      : `+${compact}`;

  return `whatsapp:${e164}`;
};

const toDayStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const normalizeLeadDays = (input) => {
  const values = Array.isArray(input) ? input : [input];
  const normalized = values
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => !Number.isNaN(value))
    .map((value) => Math.max(0, Math.min(7, value)));
  return [...new Set(normalized)].sort((a, b) => b - a);
};

const normalizeChannels = (input = {}) => ({
  email: input.email !== false,
  whatsapp: input.whatsapp !== false,
});

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!smtpConfigured()) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

const computeNextPeriod = async (userId) => {
  const logs = await PCODLog.find({
    user: userId,
    $or: [{ periodStartDate: { $ne: null } }, { periodEndDate: { $ne: null } }],
  })
    .select("periodStartDate periodEndDate")
    .sort({ periodEndDate: -1, periodStartDate: -1 })
    .limit(12);

  if (!logs.length) return null;

  const starts = logs.filter((l) => l.periodStartDate).map((l) => toDayStart(l.periodStartDate));
  const lastAnchor = logs[0].periodEndDate ? toDayStart(logs[0].periodEndDate) : starts[0];
  if (!lastAnchor) return null;
  const today = toDayStart(new Date());

  let avgCycle = 28;
  if (starts.length > 1) {
    const diffs = [];
    for (let i = 0; i < starts.length - 1; i += 1) {
      const delta = Math.round((starts[i] - starts[i + 1]) / DAY_MS);
      if (delta >= 20 && delta <= 45) diffs.push(delta);
    }
    if (diffs.length) {
      avgCycle = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
  }

  let next = new Date(lastAnchor.getTime() + avgCycle * DAY_MS);
  while (toDayStart(next) <= today) {
    next = new Date(next.getTime() + avgCycle * DAY_MS);
  }
  return next;
};

const buildEmail = ({ name, targetDate, daysUntil }) => {
  const dateText = targetDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const when = daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`;
  return {
    subject: "WellnessFit Period Reminder",
    text: `Hi ${name || "there"}, your predicted next period is ${when} (${dateText}). Stay hydrated and plan your meals/rest accordingly.`,
  };
};

const buildWhatsAppText = ({ name, targetDate, daysUntil }) => {
  const dateText = targetDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const when = daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`;
  return `WellnessFit reminder: Hi ${name || "there"}, your predicted next period is ${when} (${dateText}).`;
};

const sendWhatsAppMessage = async ({ to, body }) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  const toAddress = normalizeWhatsAppAddress(to);
  const fromAddress = normalizeWhatsAppAddress(TWILIO_WHATSAPP_FROM);
  if (!toAddress) {
    throw new Error("WhatsApp send failed: destination number is missing or invalid.");
  }
  if (!fromAddress) {
    throw new Error("WhatsApp send failed: TWILIO_WHATSAPP_FROM is missing or invalid.");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const params = new URLSearchParams({
    From: fromAddress,
    To: toAddress,
    Body: body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WhatsApp send failed: ${text}`);
  }
};

const runPeriodReminderOnce = async () => {
  const transporter = createTransporter();
  const emailEnabled = smtpConfigured() && Boolean(transporter);
  const whatsappEnabled = whatsappConfigured();
  if (!emailEnabled && !whatsappEnabled) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const users = await User.find({
    "periodReminder.enabled": true,
    $or: [{ email: { $ne: null } }, { whatsappNumber: { $ne: null } }],
  }).select("name email whatsappNumber periodReminder");

  const today = toDayStart(new Date());

  for (const user of users) {
    try {
      const targetDate = await computeNextPeriod(user._id);
      if (!targetDate) continue;

      const targetDay = toDayStart(targetDate);
      const daysUntil = Math.round((targetDay - today) / DAY_MS);
      const leadDays = normalizeLeadDays(user.periodReminder?.leadDays?.length ? user.periodReminder.leadDays : [5, 3, 1]);
      if (!leadDays.includes(daysUntil)) continue;
      const channels = normalizeChannels(user.periodReminder?.channels);

      const alreadySentToday =
        user.periodReminder?.lastSentOn &&
        toDayStart(user.periodReminder.lastSentOn).getTime() === today.getTime() &&
        user.periodReminder?.lastTargetDate &&
        toDayStart(user.periodReminder.lastTargetDate).getTime() === targetDay.getTime();
      if (alreadySentToday) continue;

      let delivered = false;

      if (channels.email && emailEnabled && user.email) {
        const email = buildEmail({ name: user.name, targetDate: targetDay, daysUntil });
        await transporter.sendMail({
          from,
          to: user.email,
          subject: email.subject,
          text: email.text,
        });
        delivered = true;
      }

      if (channels.whatsapp && whatsappEnabled && user.whatsappNumber) {
        const body = buildWhatsAppText({ name: user.name, targetDate: targetDay, daysUntil });
        await sendWhatsAppMessage({ to: user.whatsappNumber, body });
        delivered = true;
      }

      if (!delivered) continue;

      user.periodReminder.lastSentOn = new Date();
      user.periodReminder.lastTargetDate = targetDay;
      await user.save();
    } catch (err) {
      console.error(`[period-reminder] Failed for user ${user._id}:`, err.message);
    }
  }
};

const startPeriodReminderJob = () => {
  if (!remindersEnabled()) {
    return;
  }
  if (!smtpConfigured() && !whatsappConfigured()) {
    return;
  }

  console.log(`[period-reminder] Started. Channels: email=${smtpConfigured()} whatsapp=${whatsappConfigured()}`);

  runPeriodReminderOnce().catch((err) => {
    console.error("[period-reminder] Initial run failed:", err.message);
  });

  const everyHourMs = 60 * 60 * 1000;
  setInterval(() => {
    runPeriodReminderOnce().catch((err) => {
      console.error("[period-reminder] Scheduled run failed:", err.message);
    });
  }, everyHourMs);
};

module.exports = { startPeriodReminderJob };
