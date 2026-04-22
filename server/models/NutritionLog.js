const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    emoji:    String,
    category: {
      type: String,
      enum: ["protein", "carbs", "vegetables", "fruits", "dairy", "healthy_fats", "other"],
      default: "other",
    },
    quantity: { type: Number, default: 1 },
    unit:     { type: String, default: "serving" },
    calories: { type: Number, required: true },
    protein:  { type: Number, default: 0 },
    carbs:    { type: Number, default: 0 },
    fats:     { type: Number, default: 0 },
    fiber:    { type: Number, default: 0 },
  },
  { _id: false }
);

const nutritionLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    meals: {
      breakfast: [foodSchema],
      lunch:     [foodSchema],
      snack:     [foodSchema],
      dinner:    [foodSchema],
    },
    totals: {
      calories: { type: Number, default: 0 },
      protein:  { type: Number, default: 0 },
      carbs:    { type: Number, default: 0 },
      fats:     { type: Number, default: 0 },
      fiber:    { type: Number, default: 0 },
    },
    waterLitres: { type: Number, default: 0 },
    calorieGoal: { type: Number, default: 1800 },
  },
  { timestamps: true }
);

nutritionLogSchema.index({ user: 1, date: -1 });

// Auto-calculate totals before every save
nutritionLogSchema.pre("save", function (next) {
  const all = [
    ...this.meals.breakfast,
    ...this.meals.lunch,
    ...this.meals.snack,
    ...this.meals.dinner,
  ];
  const sum = (key) => all.reduce((s, f) => s + (f[key] || 0), 0);
  this.totals = {
    calories: sum("calories"),
    protein:  sum("protein"),
    carbs:    sum("carbs"),
    fats:     sum("fats"),
    fiber:    sum("fiber"),
  };
  next();
});

module.exports = mongoose.model("NutritionLog", nutritionLogSchema);
