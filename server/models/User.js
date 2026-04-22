const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    whatsappNumber: { type: String, trim: true, default: "" },
    password:       { type: String, required: true, minlength: 6, select: false },
    role:           { type: String, enum: ["user", "trainer", "admin"], default: "user" },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    goal:           { type: String, enum: ["loss", "gain", "pcod"], default: "loss" },
    emailNotifications: { type: Boolean, default: true },
    gender:         {
      type: String,
      enum: ["female", "male", "other", "prefer_not_to_say"],
      default: "female",
    },
    age:            Number,
    heightCm:       Number,
    startingWeight: Number,
    targetWeight:   Number,
    activityLevel:  {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "moderate",
    },
    trainerProfile: {
      specialization: { type: String, default: "" },
      experienceYears: { type: Number, default: 0 },
      certifications: { type: String, default: "" },
      clientCapacity: { type: Number, default: 0 },
    },
    preferences: {
      app: {
        theme: { type: String, enum: ["garden", "sunrise", "midnight"], default: "garden" },
        language: { type: String, enum: ["en", "ta"], default: "en" },
        weightUnit: { type: String, enum: ["kg", "lb"], default: "kg" },
        heightUnit: { type: String, enum: ["cm", "ft"], default: "cm" },
        soundEnabled: { type: Boolean, default: true },
        ambientMode: { type: String, enum: ["soft", "bright", "minimal"], default: "soft" },
      },
      notifications: {
        workoutEnabled: { type: Boolean, default: false },
        workoutTime: { type: String, default: "18:00" },
        workoutLastTriggeredAt: { type: Date, default: null },
        mealEnabled: { type: Boolean, default: false },
        mealTime: { type: String, default: "13:00" },
        waterEnabled: { type: Boolean, default: true },
        pushEnabled: { type: Boolean, default: true },
        weeklySummary: { type: Boolean, default: true },
      },
      goals: {
        weeklyWeightGoalKg: { type: Number, default: 0.5 },
        dailyStepGoal: { type: Number, default: 8000 },
        calorieGoal: { type: Number, default: 1800 },
      },
      nutrition: {
        dietType: { type: String, enum: ["balanced", "veg", "non_veg", "vegan"], default: "balanced" },
        allergies: { type: String, default: "" },
        waterGoalLiters: { type: Number, default: 2.5 },
      },
      privacy: {
        dataSharing: { type: Boolean, default: false },
        twoFactorEnabled: { type: Boolean, default: false },
      },
    },
    periodReminder: {
      enabled: { type: Boolean, default: false },
      leadDays: {
        type: [{ type: Number, min: 0, max: 7 }],
        default: [5, 3, 1],
      },
      channels: {
        email: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true },
      },
      lastSentOn: Date,
      lastTargetDate: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
