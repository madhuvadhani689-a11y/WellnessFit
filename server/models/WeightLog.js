const mongoose = require("mongoose");

const weightLogSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    weight:     { type: Number, required: true },   // kg
    bmi:        Number,
    bodyFat:    Number,                              // %
    muscleMass: Number,                              // kg
    notes:      String,
    loggedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

weightLogSchema.index({ user: 1, loggedAt: -1 });

module.exports = mongoose.model("WeightLog", weightLogSchema);
