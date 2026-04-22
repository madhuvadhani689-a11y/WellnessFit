const router = require("express").Router();
const PCODLog = require("../models/PCODLog");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

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

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const todayRange = () => {
  const s = new Date();
  s.setHours(0, 0, 0, 0);
  const e = new Date();
  e.setHours(23, 59, 59, 999);
  return { $gte: s, $lte: e };
};

// POST /api/pcod - create or update today's log
router.post("/", protect, async (req, res) => {
  try {
    const { symptoms, mood, painLevel, periodStartDate, periodEndDate, hormones, notes } = req.body;

    let log = await PCODLog.findOne({ user: req.user._id, loggedAt: todayRange() });

    if (log) {
      Object.assign(log, { symptoms, mood, painLevel, hormones, notes });
      if (periodStartDate) log.periodStartDate = periodStartDate;
      if (periodEndDate) log.periodEndDate = periodEndDate;
      await log.save();
    } else {
      log = await PCODLog.create({
        user: req.user._id,
        symptoms,
        mood,
        painLevel,
        periodStartDate,
        periodEndDate,
        hormones,
        notes,
      });
    }

    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/pcod - logs + computed cycle info
router.get("/", protect, async (req, res) => {
  try {
    const logs = await PCODLog.find({ user: req.user._id }).sort({ loggedAt: -1 }).limit(90);

    const periodLogs = logs
      .filter((l) => l.periodStartDate)
      .sort((a, b) => new Date(b.periodStartDate) - new Date(a.periodStartDate));

    let cycleInfo = null;
    if (periodLogs.length) {
      const lastStart = new Date(periodLogs[0].periodStartDate);
      const lastEnd = periodLogs[0].periodEndDate ? new Date(periodLogs[0].periodEndDate) : null;
      const today = toStartOfDay(new Date());
      const daysSince = Math.floor((today - toStartOfDay(lastStart)) / 864e5);

      let avgCycle = 28;
      if (periodLogs.length > 1) {
        const diffs = periodLogs
          .slice(0, -1)
          .map((l, i) => (new Date(l.periodStartDate) - new Date(periodLogs[i + 1].periodStartDate)) / 864e5)
          .filter((val) => val >= 20 && val <= 45);
        if (diffs.length > 0) {
          avgCycle = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
        }
      }
      
      if (!avgCycle || avgCycle < 1) avgCycle = 28;

      const reminderBase = lastEnd && !Number.isNaN(lastEnd.getTime()) ? lastEnd : lastStart;
      let nextPeriod = new Date(reminderBase.getTime() + avgCycle * 864e5);
      while (toStartOfDay(nextPeriod) <= today) {
        nextPeriod = new Date(nextPeriod.getTime() + avgCycle * 864e5);
      }

      const daysUntilNext = Math.round((toStartOfDay(nextPeriod) - today) / 864e5);
      const projectedCycleDay = ((daysSince % avgCycle) + avgCycle) % avgCycle + 1;
      const phase =
        projectedCycleDay <= 5 ? "Menstrual" :
        projectedCycleDay <= 11 ? "Follicular" :
        projectedCycleDay <= 14 ? "Ovulatory" : "Luteal";

      cycleInfo = { cycleDay: projectedCycleDay, avgCycle, phase, nextPeriod, lastPeriodEndDate: lastEnd };
    }

    const reminder = {
      enabled: Boolean(req.user.periodReminder?.enabled),
      leadDays: normalizeLeadDays(req.user.periodReminder?.leadDays?.length ? req.user.periodReminder.leadDays : [5, 3, 1]),
      channels: normalizeChannels(req.user.periodReminder?.channels),
    };
    res.json({ logs, cycleInfo, reminder, whatsappNumber: req.user.whatsappNumber || "" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/pcod/reminder
router.get("/reminder", protect, async (req, res) => {
  try {
    const reminder = {
      enabled: Boolean(req.user.periodReminder?.enabled),
      leadDays: normalizeLeadDays(req.user.periodReminder?.leadDays?.length ? req.user.periodReminder.leadDays : [5, 3, 1]),
      channels: normalizeChannels(req.user.periodReminder?.channels),
    };
    res.json({ reminder, whatsappNumber: req.user.whatsappNumber || "" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/pcod/reminder
router.put("/reminder", protect, async (req, res) => {
  try {
    const enabled = Boolean(req.body.enabled);
    const leadDays = normalizeLeadDays(req.body.leadDays);
    const finalLeadDays = leadDays.length ? leadDays : [5, 3, 1];
    const channels = normalizeChannels(req.body.channels);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        periodReminder: { ...req.user.periodReminder, enabled, leadDays: finalLeadDays, channels },
      },
      { new: true }
    ).select("periodReminder");

    res.json({
      reminder: user?.periodReminder || { enabled, leadDays: finalLeadDays, channels },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/pcod/insights - pattern-based insights
router.get("/insights", protect, async (req, res) => {
  try {
    const logs = await PCODLog.find({ user: req.user._id }).sort({ loggedAt: -1 }).limit(30);

    const insights = [];

    const counts = {};
    logs.flatMap((l) => l.symptoms || []).forEach((s) => {
      counts[s.name] = (counts[s.name] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      insights.push({
        type: "symptom",
        title: `${top[0]} is your most frequent symptom`,
        text: `Logged ${top[1]} times in the past 30 days.`,
      });
    }

    const moods = logs.filter((l) => l.mood != null).map((l) => l.mood);
    if (moods.length) {
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      const labels = ["Poor", "Low", "Moderate", "Good", "Excellent"];
      insights.push({ type: "mood", title: "Average mood", text: labels[Math.round(avg)] });
    }

    res.json({ insights });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
