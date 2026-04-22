const mongoose = require("mongoose");

const workoutReminderLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reminderTime: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    triggeredAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["queued", "triggered"], default: "triggered" },
    channel: { type: String, enum: ["in_app"], default: "in_app" },
  },
  { timestamps: true }
);

workoutReminderLogSchema.index({ user: 1, scheduledFor: -1 });

module.exports = mongoose.model("WorkoutReminderLog", workoutReminderLogSchema);

