const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema(
  { name: String, severity: { type: Number, min: 0, max: 10 } },
  { _id: false }
);

const pcodLogSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    periodStartDate: Date,
    periodEndDate:   Date,
    cycleLength:     { type: Number, default: 28 },
    symptoms:        [symptomSchema],
    mood:            { type: Number, min: 0, max: 4 },   // 0–4
    painLevel:       { type: Number, min: 0, max: 9, default: 0 },
    hormones: {
      estrogen:      Number,
      progesterone:  Number,
      lh:            Number,
      fsh:           Number,
      testosterone:  Number,
      insulin:       Number,
    },
    notes:    String,
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pcodLogSchema.index({ user: 1, loggedAt: -1 });

module.exports = mongoose.model("PCODLog", pcodLogSchema);
