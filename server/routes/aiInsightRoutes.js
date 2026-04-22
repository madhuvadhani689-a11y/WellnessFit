const express = require("express");
const PCODLog = require("../models/PCODLog");
const WeightLog = require("../models/WeightLog");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const axios = require("axios");

const router = express.Router();

router.post("/ai-insights", protect, async (req, res) => {
  console.log('AI route hit');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('Request body:', req.body);
  
  const fallback = {
    prediction: "You are on Day 12 — energy is building 🌿",
    topPattern: "Keep logging to discover your patterns",
    foodTip: "Iron-rich foods like spinach help this phase",
    exerciseTip: "Great time for moderate cardio today",
    encouragement: "Every log brings you closer to understanding your body 💚"
  };

  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      console.warn("No userId found.");
      return res.json(fallback);
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [pcodLogs, weightLogs] = await Promise.all([
      PCODLog.find({ user: userId, loggedAt: { $gte: ninetyDaysAgo } }).sort({ loggedAt: -1 }).lean(),
      WeightLog.find({ user: userId, date: { $gte: ninetyDaysAgo } }).sort({ date: -1 }).lean()
    ]);

    const reportData = {
      pcodEntries: pcodLogs.length,
      recentSymptoms: pcodLogs.slice(0, 5).map(l => l.symptoms?.map(s => s.name).join(", ") || "").filter(Boolean),
      weightEntries: weightLogs.length,
      latestWeight: weightLogs[0]?.weightKg || "Unknown"
    };

    const promptText = `You are a wellness assistant. Give friendly, non-medical personal insights based on cycle tracking data. Never diagnose. Never mention doctors. Keep it warm and encouraging.
    
    User Data: ${JSON.stringify(reportData)}
    
    Return ONLY valid JSON (no markdown) with these exact keys:
    { "prediction": "string", "topPattern": "string", "foodTip": "string", "exerciseTip": "string", "encouragement": "string" }`;

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("No API Key defined in environment");
      return res.json(fallback);
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: promptText
        }]
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
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const insights = JSON.parse(cleaned);

    return res.json(insights);

  } catch (err) {
    console.error("AI Insight Route error:", err.message);
    return res.json(fallback);
  }
});

module.exports = router;

