const express = require("express");
const router = express.Router();
const WeightLog = require("../models/WeightLog");
const PCODLog = require("../models/PCODLog");
const NutritionLog = require("../models/NutritionLog");

const buildEvents = (weights, pcod, nutrition) => {
  const events = [];
  try {
    // Weight changes
    weights.forEach((log, i) => {
      if (i > 0) {
        const diff = log.weight - weights[i-1].weight;
        if (Math.abs(diff) >= 0.5) {
          events.push({
            date: log.date,
            type: diff < 0 ? 'weight_loss' : 'weight_gain',
            icon: '⚖️',
            color: diff < 0 ? '#0F6E56' : '#854F0B',
            text: diff < 0 
              ? `Lost ${Math.abs(diff).toFixed(1)}kg 🎉`
              : `Gained ${diff.toFixed(1)}kg`
          });
        }
      }
    });

    // Cycle events
    pcod.forEach((log) => {
      if (log.cycleDay === 1) {
        events.push({
          date: log.date,
          type: 'period_start',
          icon: '🌸',
          color: '#d4537e',
          text: 'New cycle started'
        });
      }
      if (log.symptoms?.length === 0) {
        events.push({
          date: log.date,
          type: 'symptom_free',
          icon: '✨',
          color: '#0F6E56',
          text: 'Symptom-free day!'
        });
      }
    });

    // Nutrition goals
    nutrition.forEach((log) => {
      if (log.calories >= (log.calorieGoal * 0.9)) {
        events.push({
          date: log.date,
          type: 'goal_met',
          icon: '🎯',
          color: '#3d5a3e',
          text: 'Hit nutrition goal!'
        });
      }
    });
  } catch (e) {
    console.error('Timeline build error:', e.message);
  }
  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
};

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Fetch logs from all collections
    const rawWeights = await WeightLog.find({ user: userId, loggedAt: { $gte: ninetyDaysAgo } }).sort({ loggedAt: 1 }).lean();
    const rawPcod = await PCODLog.find({ user: userId, loggedAt: { $gte: ninetyDaysAgo } }).sort({ loggedAt: 1 }).lean();
    const rawNutrition = await NutritionLog.find({ user: userId, date: { $gte: ninetyDaysAgo } }).sort({ date: 1 }).lean();

    // Transform and normalize before passing to buildEvents to ensure 'date', 'calories', 'cycleDay' fields exist
    const weights = rawWeights.map(w => ({
      ...w,
      date: w.loggedAt || w.date
    }));

    const pcod = rawPcod.map(p => {
      // Rough approximation: If a period started on this day, treat it as cycleDay 1, otherwise map appropriately
      // Assuming PCODLog doesn't have cycleDay directly mapped by the user structure:
      // In the provided model PCODLog has periodStartDate and loggedAt. If they match, cycleDay = 1.
      let cycleDay = 0;
      const logDateStr = new Date(p.loggedAt || p.date).toISOString().split('T')[0];
      const periodStartStr = p.periodStartDate ? new Date(p.periodStartDate).toISOString().split('T')[0] : null;
      if (logDateStr === periodStartStr) {
        cycleDay = 1;
      }
      return {
        ...p,
        date: p.loggedAt || p.date,
        // Provide cycleDay=1 directly if periodStartDate == loggedAt
        cycleDay: cycleDay
      };
    });

    const nutrition = rawNutrition.map(n => ({
      ...n,
      date: n.date,
      calories: n.totals?.calories || 0
    }));

    // Generate unified events
    const allEvents = buildEvents(weights, pcod, nutrition);
    
    if (allEvents.length === 0) {
      return res.status(200).json({
        events: [],
        total: 0,
        page,
        pages: 0,
        message: "No timeline data yet"
      });
    }

    // Paginate
    const total = allEvents.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedEvents = allEvents.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      events: paginatedEvents,
      total,
      page,
      pages
    });
  } catch (error) {
    console.error("Timeline fetching failed:", error);
    // Never crash, return empty array if failed
    return res.status(200).json({
      events: [],
      total: 0,
      page: 1,
      pages: 0,
      message: "Timeline currently unavailable"
    });
  }
});

module.exports = router;
