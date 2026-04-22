const mongoose = require("mongoose");

const workoutItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    durationMin: { type: Number, required: true },
    instructions: { type: String, default: "" },
    sets: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    restTime: { type: String, default: "" },
  },
  { _id: false }
);

const zumbaSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    durationMin: { type: Number, required: true },
    focus: { type: String, default: "" },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedByTrainer: { type: Boolean, default: false },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    availableMinutes: { type: Number, required: true },
    goal: { type: String, enum: ["loss", "gain", "pcod"], default: "loss" },
    intensity: { type: String, enum: ["light", "moderate", "high"], default: "moderate" },
    planTitle: { type: String, required: true },
    analysis: { type: String, default: "" },
    blocks: [workoutItemSchema],
    zumbaSessions: [zumbaSessionSchema],
    status: { type: String, enum: ["scheduled", "completed", "skipped", "draft", "active"], default: "scheduled" },
    notes: { type: String, default: "" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedAt: { type: Date, default: null },
    trainerNotes: { type: String, default: "" },
    privateNotes: { type: String, default: "" },
    isTemplate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

workoutPlanSchema.index({ user: 1, date: 1, startTime: 1 });

module.exports = mongoose.model("WorkoutPlan", workoutPlanSchema);
