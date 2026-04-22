const router = require("express").Router();
const { protect } = require("../middleware/auth");
const AnalyticsState = require("../models/AnalyticsState");
const WeightLog = require("../models/WeightLog");
const NutritionLog = require("../models/NutritionLog");
const PCODLog = require("../models/PCODLog");

const DAY_MS = 864e5;

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const computeCycleInfo = (logs = []) => {
  const periodLogs = logs
    .filter((log) => log.periodStartDate)
    .sort((a, b) => new Date(b.periodStartDate) - new Date(a.periodStartDate));

  if (!periodLogs.length) return null;

  const lastStart = toStartOfDay(periodLogs[0].periodStartDate);
  const lastEnd = periodLogs[0].periodEndDate ? toStartOfDay(periodLogs[0].periodEndDate) : null;
  const today = toStartOfDay(new Date());
  const daysSince = Math.floor((today - lastStart) / DAY_MS);

  let avgCycle = 28;
  if (periodLogs.length > 1) {
    const diffs = periodLogs
      .slice(0, -1)
      .map((log, i) => (new Date(log.periodStartDate) - new Date(periodLogs[i + 1].periodStartDate)) / DAY_MS)
      .filter((value) => value >= 20 && value <= 45);
    if (diffs.length) {
      avgCycle = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
  }

  const reminderBase = lastEnd || lastStart;
  let nextPeriod = new Date(reminderBase.getTime() + avgCycle * DAY_MS);
  while (toStartOfDay(nextPeriod) <= today) {
    nextPeriod = new Date(nextPeriod.getTime() + avgCycle * DAY_MS);
  }

  const projectedCycleDay = ((daysSince % avgCycle) + avgCycle) % avgCycle + 1;
  const phase =
    projectedCycleDay <= 5 ? "Menstrual" :
    projectedCycleDay <= 11 ? "Follicular" :
    projectedCycleDay <= 14 ? "Ovulatory" : "Luteal";

  return { cycleDay: projectedCycleDay, phase, avgCycle, nextPeriod };
};

const computeInsights = (logs = []) => {
  const insights = [];
  const symptomCounts = {};
  logs.flatMap((log) => log.symptoms || []).forEach((symptom) => {
    if (!symptom?.name) return;
    symptomCounts[symptom.name] = (symptomCounts[symptom.name] || 0) + 1;
  });
  const top = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    insights.push({
      type: "symptom",
      title: `${top[0]} is your most frequent symptom`,
      text: `Logged ${top[1]} times in recent records.`,
    });
  }

  const moods = logs.filter((log) => log.mood != null).map((log) => log.mood);
  if (moods.length) {
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    const labels = ["Poor", "Low", "Moderate", "Good", "Excellent"];
    insights.push({
      type: "mood",
      title: "Average mood",
      text: labels[Math.round(avg)] || "Moderate",
    });
  }

  return insights;
};

const buildAnalyticsSummary = async (userId) => {
  const [weightLogs, nutritionLogs, pcodLogs] = await Promise.all([
    WeightLog.find({
      user: userId,
      loggedAt: { $gte: new Date(Date.now() - 90 * DAY_MS) },
    })
      .sort({ loggedAt: -1 })
      .limit(100),
    NutritionLog.find({
      user: userId,
      date: { $gte: new Date(Date.now() - 14 * DAY_MS) },
    }).sort({ date: -1 }),
    PCODLog.find({ user: userId }).sort({ loggedAt: -1 }).limit(90),
  ]);

  const weightStats = weightLogs.length
    ? {
        latest: weightLogs[0].weight,
        oldest: weightLogs[weightLogs.length - 1].weight,
        change: +(weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight).toFixed(1),
        count: weightLogs.length,
      }
    : {};

  return {
    weight: { logs: weightLogs, stats: weightStats },
    nutrition: { logs: nutritionLogs },
    pcod: {
      logs: pcodLogs,
      cycleInfo: computeCycleInfo(pcodLogs),
      insights: computeInsights(pcodLogs),
    },
    generatedAt: new Date(),
  };
};

// GET /api/analytics/summary
router.get("/summary", protect, async (req, res) => {
  try {
    const live = await buildAnalyticsSummary(req.user._id);

    await AnalyticsState.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          analytics: live,
          generatedAt: new Date(),
          source: "live",
        },
      },
      { upsert: true, new: true }
    );

    return res.json({ source: "live", analytics: live });
  } catch (err) {
    const cached = await AnalyticsState.findOne({ user: req.user._id });
    if (cached?.analytics) {
      return res.json({
        source: "cache",
        analytics: cached.analytics,
        message: "Showing cached analytics because live refresh failed.",
      });
    }
    return res.status(500).json({ message: err.message || "Unable to load analytics." });
  }
});

// POST /api/analytics/snapshot
router.post("/snapshot", protect, async (req, res) => {
  try {
    if (!req.body || typeof req.body.analytics !== "object") {
      return res.status(400).json({ message: "analytics object is required" });
    }

    const snapshot = await AnalyticsState.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          analytics: req.body.analytics,
          generatedAt: new Date(),
          source: "manual",
        },
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({ snapshot });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Unable to save analytics snapshot." });
  }
});

module.exports = router;

