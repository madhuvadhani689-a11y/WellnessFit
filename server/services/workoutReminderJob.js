const User = require("../models/User");
const WorkoutReminderLog = require("../models/WorkoutReminderLog");
const { sendEmail } = require("../utils/emailService");

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
let jobStarted = false;

const pad = (value) => String(value).padStart(2, "0");
const toHHMM = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const runWorkoutReminderSweep = async () => {
  const now = new Date();
  const hhmm = toHHMM(now);
  if (!HHMM.test(hhmm)) return;

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const users = await User.find({
    "preferences.notifications.workoutEnabled": true,
    "preferences.notifications.workoutTime": hhmm,
    $or: [
      { "preferences.notifications.workoutLastTriggeredAt": { $exists: false } },
      { "preferences.notifications.workoutLastTriggeredAt": null },
      { "preferences.notifications.workoutLastTriggeredAt": { $lt: dayStart } },
    ],
  }).select("_id preferences.notifications.workoutTime");

  if (!users.length) return;

  for (const user of users) {
    if (user.emailNotifications !== false) {
      await sendEmail(
        user.email,
        "💪 Time for your Workout!",
        `<div style="font-family:Arial;max-width:500px;margin:auto;padding:24px;background:#faf9f6;">
          <h2 style="color:#3d5a3e;">WellnessFit 🌿</h2>
          <p>Hi!</p>
          <p style="font-size:16px;">It's <strong>${hhmm}</strong>! Time for your scheduled workout 💪</p>
          <p>Jump to your dashboard to get started.</p>
        </div>`
      ).catch(() => {});
    }
  }

  await WorkoutReminderLog.insertMany(
    users.map((user) => ({
      user: user._id,
      reminderTime: user.preferences?.notifications?.workoutTime || hhmm,
      scheduledFor: now,
      triggeredAt: now,
      status: "triggered",
      channel: "email_and_app",
    }))
  );

  await User.updateMany(
    { _id: { $in: users.map((user) => user._id) } },
    {
      $set: { "preferences.notifications.workoutLastTriggeredAt": now },
    }
  );
};

const startWorkoutReminderJob = () => {
  if (jobStarted) return;
  jobStarted = true;

  console.log("[workout-reminder] Background scheduler started (every 60s).");

  runWorkoutReminderSweep().catch((err) => {
    console.error("[workout-reminder] Initial sweep failed:", err.message);
  });

  setInterval(() => {
    runWorkoutReminderSweep().catch((err) => {
      console.error("[workout-reminder] Sweep failed:", err.message);
    });
  }, 60 * 1000);
};

module.exports = { startWorkoutReminderJob };

