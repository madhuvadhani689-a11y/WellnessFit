const express = require("express");
const PCODLog = require("../models/PCODLog");
const NutritionLog = require("../models/NutritionLog");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [nutritionLogs, pcodLogs] = await Promise.all([
      NutritionLog.find({ user: userId, date: { $gte: thirtyDaysAgo } }).lean(),
      PCODLog.find({ user: userId, loggedAt: { $gte: thirtyDaysAgo } }).lean()
    ]);

    const daysMap = {};
    
    // Process PCOD Logs
    for (const log of pcodLogs) {
      if (!log.loggedAt) continue;
      const dateStr = new Date(log.loggedAt).toISOString().split('T')[0];
      const hasBadSyms = log.symptoms?.some(s => s.severity > 3);
      const topSym = log.symptoms?.sort((a,b) => b.severity - a.severity)?.[0];
      
      daysMap[dateStr] = { 
        hasBadSyms: !!hasBadSyms, 
        symptomName: topSym?.name || "Symptoms",
        foods: new Set() 
      };
    }

    // Process Nutrition Logs
    for (const log of nutritionLogs) {
      if (!log.date) continue;
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      if (!daysMap[dateStr]) {
        daysMap[dateStr] = { hasBadSyms: false, symptomName: null, foods: new Set() };
      }
      
      const mealsFood = [
        ...(log.meals?.breakfast || []),
        ...(log.meals?.lunch || []),
        ...(log.meals?.snack || []),
        ...(log.meals?.dinner || []),
      ];

      for (const food of mealsFood) {
        if (!food?.name) continue;
        const n = food.name.toLowerCase();
        const cat = food.category || "";
        
        if (cat === "dairy" || n.includes("milk") || n.includes("cheese")) daysMap[dateStr].foods.add("Dairy");
        if (cat === "protein") daysMap[dateStr].foods.add("Protein");
        if (cat === "vegetables" || n.includes("veg")) daysMap[dateStr].foods.add("Vegetables");
        if (n.includes("sugar") || n.includes("sweet") || n.includes("chocolate") || n.includes("cake")) daysMap[dateStr].foods.add("Sugar");
        if (n.includes("gluten") || n.includes("bread") || n.includes("wheat") || n.includes("pasta") || cat === "carbs") daysMap[dateStr].foods.add("High Carbs/Gluten");
        if (cat === "fruits") daysMap[dateStr].foods.add("Fruits");
      }
    }

    const foodStats = {};
    for (const data of Object.values(daysMap)) {
      for (const food of data.foods) {
        if (!foodStats[food]) foodStats[food] = { totalDays: 0, badDays: 0, syms: {} };
        foodStats[food].totalDays++;
        if (data.hasBadSyms) {
          foodStats[food].badDays++;
          if (data.symptomName) {
            foodStats[food].syms[data.symptomName] = (foodStats[food].syms[data.symptomName] || 0) + 1;
          }
        }
      }
    }

    const triggers = [];
    const protective = [];

    for (const [food, stats] of Object.entries(foodStats)) {
      if (stats.totalDays < 3) continue; // minimum sample requirement
      const badRatio = stats.badDays / stats.totalDays;
      const pct = Math.round(badRatio * 100);
      
      let topSym = "Symptoms";
      let maxCount = 0;
      for (const [s, c] of Object.entries(stats.syms)) {
        if (c > maxCount) { maxCount = c; topSym = s; }
      }

      if (badRatio > 0.6) {
        triggers.push({ food, percentage: pct, symptom: topSym });
      } else if (badRatio < 0.35) {
        protective.push({ food, percentage: 100 - pct });
      }
    }
    
    triggers.sort((a,b) => b.percentage - a.percentage);
    protective.sort((a,b) => b.percentage - a.percentage);

    return res.json({ 
      triggers: triggers.slice(0, 3), 
      protective: protective.slice(0, 3) 
    });

  } catch (err) {
    console.error("Correlation error:", err);
    return res.status(500).json({ error: "Could not calculate correlation." });
  }
});

module.exports = router;
