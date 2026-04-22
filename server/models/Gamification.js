const mongoose = require("mongoose");

const gamificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    lastCheckInDate: { type: Date, default: null },
    badges: [
      {
        type: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gamification", gamificationSchema);
