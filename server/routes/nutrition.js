const router       = require("express").Router();
const axios        = require("axios");
const NutritionLog = require("../models/NutritionLog");
const User = require("../models/User");
const { protect }  = require("../middleware/auth");
const FOOD_CATEGORIES = new Set(["protein", "carbs", "vegetables", "fruits", "dairy", "healthy_fats", "other"]);

const todayRange = () => {
  const s = new Date(); s.setHours(0, 0, 0, 0);
  const e = new Date(); e.setHours(23, 59, 59, 999);
  return { $gte: s, $lte: e };
};

const getOrCreateToday = async (userId) => {
  let log = await NutritionLog.findOne({ user: userId, date: todayRange() });
  if (!log) {
    const user = await User.findById(userId).select("preferences.goals.calorieGoal");
    log = await NutritionLog.create({
      user: userId,
      meals: { breakfast: [], lunch: [], snack: [], dinner: [] },
      calorieGoal: user?.preferences?.goals?.calorieGoal || 1800,
    });
  }
  return log;
};

// GET /api/nutrition/today
router.get("/today", protect, async (req, res) => {
  try {
    res.json({ log: await getOrCreateToday(req.user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/nutrition/food  – add food item
// body: { mealType: "breakfast"|"lunch"|"snack"|"dinner", food: {...} }
router.post("/food", protect, async (req, res) => {
  try {
    const { mealType, food } = req.body;
    if (!["breakfast","lunch","snack","dinner"].includes(mealType))
      return res.status(400).json({ message: "Invalid mealType" });
    if (!food?.name || typeof food.calories !== "number")
      return res.status(400).json({ message: "Food name and calories are required" });

    const log = await getOrCreateToday(req.user._id);
    const category = FOOD_CATEGORIES.has(food.category) ? food.category : "other";
    log.meals[mealType].push({ ...food, category });
    await log.save();
    res.json({ log });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/nutrition/food  – remove food by index
// body: { mealType, index }
router.delete("/food", protect, async (req, res) => {
  try {
    const { mealType, index } = req.body;
    if (!["breakfast", "lunch", "snack", "dinner"].includes(mealType)) {
      return res.status(400).json({ message: "Invalid mealType" });
    }
    const numericIndex = Number(index);
    if (!Number.isInteger(numericIndex) || numericIndex < 0) {
      return res.status(400).json({ message: "Invalid index" });
    }

    const log = await getOrCreateToday(req.user._id);
    if (numericIndex >= log.meals[mealType].length) {
      return res.status(404).json({ message: "Food item not found" });
    }
    log.meals[mealType].splice(numericIndex, 1);
    await log.save();
    res.json({ log });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/nutrition/water  – update water intake
// body: { waterLitres }
router.put("/water", protect, async (req, res) => {
  try {
    const waterLitres = Number(req.body.waterLitres);
    if (!Number.isFinite(waterLitres) || waterLitres < 0 || waterLitres > 10) {
      return res.status(400).json({ message: "waterLitres must be between 0 and 10" });
    }

    const log = await getOrCreateToday(req.user._id);
    log.waterLitres = Number(waterLitres.toFixed(2));
    await log.save();
    res.json({ log });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/nutrition/history?days=7
router.get("/history", protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const logs = await NutritionLog.find({
      user: req.user._id,
      date: { $gte: new Date(Date.now() - days * 864e5) },
    }).sort({ date: -1 });
    res.json({ logs });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/nutrition/meal-plan  – goal-based dynamic meal suggestions
router.post("/meal-plan", protect, async (req, res) => {
  const { favoriteDish, dislikedFoods = [], calorieGoal, cyclePhase } = req.body;

  const userGoal = req.user.goal || 'loss';
  const getFallback = (goal) => {
    const plans = {
      loss: {
        calorieTarget: 1600,
        breakfast: [{ food: "Oats + berries", quantity: "1 bowl", calories: 320, reason: "Fiber rich" }],
        lunch: [{ food: "Dal + brown rice + salad", quantity: "1 plate", calories: 520, reason: "Balanced meal" }],
        snack: [{ food: "Apple + almond butter", quantity: "1 apple", calories: 200, reason: "Healthy fat" }],
        dinner: [{ food: "Grilled fish + steamed veggies", quantity: "1 plate", calories: 350, reason: "Light dinner" }],
        totalCalories: 1390,
        highlight: "Fallback: Stick to whole foods."
      },
      pcod: {
        calorieTarget: 1700,
        breakfast: [{ food: "Overnight oats + chia", quantity: "1 jar", calories: 310, reason: "Low GI" }],
        lunch: [{ food: "Quinoa + chickpeas + veggies", quantity: "1 bowl", calories: 450, reason: "Protein packed" }],
        snack: [{ food: "Walnuts + green tea", quantity: "1 handful", calories: 160, reason: "Antioxidants" }],
        dinner: [{ food: "Baked chicken + sweet potato", quantity: "1 plate", calories: 420, reason: "Nourishing" }],
        totalCalories: 1340,
        highlight: "Fallback: Focus on low glycemic index foods."
      },
      gain: {
        calorieTarget: 2800,
        breakfast: [{ food: "5 eggs scrambled + toast", quantity: "1 plate", calories: 480, reason: "High protein" }],
        lunch: [{ food: "Chicken biryani large", quantity: "1 plate", calories: 750, reason: "Calorie dense" }],
        snack: [{ food: "PB banana sandwich", quantity: "1 sandwich", calories: 400, reason: "Energy boost" }],
        dinner: [{ food: "Mutton curry + rice", quantity: "1 bowl", calories: 700, reason: "Muscle repair" }],
        totalCalories: 2330,
        highlight: "Fallback: Ensure enough calories for your surplus."
      }
    };
    return plans[goal] || plans.loss;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ plan: getFallback(userGoal) });
  }

  const prompt = `
You are a PCOD-friendly Indian nutritionist.
Create a personalized 1-day diet chart for this user:

User preferences:
- Favorite dish: ${favoriteDish || 'None'}
- Disliked/avoided foods: ${Array.isArray(dislikedFoods) ? dislikedFoods.join(', ') : 'None'}
- Daily calorie goal: ${calorieGoal || 1800} kcal
- Current cycle phase: ${cyclePhase || 'Follicular'}

Rules:
1. INCLUDE the favorite dish in one meal if healthy
2. NEVER include any disliked foods
3. Focus on Indian/Tamil foods
4. Match the cycle phase nutrition needs:
   Menstrual: iron-rich foods
   Follicular: protein + fermented foods
   Ovulatory: anti-inflammatory foods
   Luteal: magnesium + comfort foods
5. Total calories must be close to ${calorieGoal || 1800}

Return ONLY valid JSON (no markdown, no explanation):
{
  "breakfast": [
    {"food": "name", "quantity": "amount", "calories": number, "reason": "why this food"}
  ],
  "lunch": [
    {"food": "name", "quantity": "amount", "calories": number, "reason": "why this food"}
  ],
  "snack": [
    {"food": "name", "quantity": "amount", "calories": number, "reason": "why this food"}
  ],
  "dinner": [
    {"food": "name", "quantity": "amount", "calories": number, "reason": "why this food"}
  ],
  "totalCalories": number,
  "highlight": "one personalized tip for this user"
}
`;

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    const rawText = response.data.content[0].text;
    const cleaned = rawText.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const chart = JSON.parse(cleaned);

    return res.json({ plan: chart });
  } catch (err) {
    console.error("Claude Diet Chart API Error:", err.message);
    return res.json({ plan: getFallback(userGoal) });
  }
});

// GET /api/nutrition/weekly-report/:userId
router.get("/weekly-report/:userId", protect, async (req, res) => {
  try {
    const logs = await NutritionLog.find({
      user: req.user._id,
      date: { $gte: new Date(Date.now() - 7 * 864e5) },
    });

    let totalCals = 0, totalPro = 0, totalCarb = 0, totalFat = 0, totalWater = 0;
    let daysMet = 0;
    let bestDay = null;
    let closestDiff = Infinity;
    const foodCounts = {};
    let validDays = 0;

    logs.forEach(log => {
      const c = log.totals.calories;
      if (c > 0 || log.waterLitres > 0) {
        if (c > 0) validDays++;
        
        totalCals += c;
        totalPro += log.totals.protein;
        totalCarb += log.totals.carbs;
        totalFat += log.totals.fats;
        totalWater += log.waterLitres || 0;

        if (c > 0) {
          const diff = Math.abs(c - log.calorieGoal);
          if (diff < closestDiff) {
            closestDiff = diff;
            bestDay = log.date;
          }
          if (c >= log.calorieGoal * 0.85 && c <= log.calorieGoal * 1.15) {
            daysMet++;
          }
        }

        const allFoods = [...(log.meals.breakfast||[]), ...(log.meals.lunch||[]), ...(log.meals.snack||[]), ...(log.meals.dinner||[])];
        allFoods.forEach(f => {
          foodCounts[f.name] = (foodCounts[f.name] || 0) + 1;
        });
      }
    });

    const topFood = Object.entries(foodCounts).sort((a,b) => b[1] - a[1])[0];
    const avg = validDays > 0 ? {
      calories: Math.round(totalCals / validDays),
      protein: Math.round(totalPro / validDays),
      carbs: Math.round(totalCarb / validDays),
      fats: Math.round(totalFat / validDays),
      water: Number((totalWater / Math.max(1, logs.filter(l => l.waterLitres > 0).length)).toFixed(1))
    } : { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 };

    // chartData requires days sorted
    const filledLogs = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      d.setHours(0,0,0,0);
      const match = logs.find(l => {
        const ld = new Date(l.date);
        ld.setHours(0,0,0,0);
        return ld.getTime() === d.getTime();
      });
      filledLogs.push({
        date: d.toLocaleDateString("en-US", { weekday: 'short' }),
        calories: match ? match.totals.calories : 0
      });
    }

    res.json({
      avg,
      daysMet,
      validDays,
      bestDay,
      topFood: topFood ? topFood[0] : null,
      topFoodCount: topFood ? topFood[1] : 0,
      chartData: filledLogs
    });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
