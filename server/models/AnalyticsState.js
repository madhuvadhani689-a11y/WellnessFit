const mongoose = require("mongoose");

const analyticsStateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    analytics: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, default: Date.now },
    source: { type: String, enum: ["live", "manual"], default: "live" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AnalyticsState", analyticsStateSchema);

