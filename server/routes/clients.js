const express = require("express");
const mongoose = require("mongoose");
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/User");
const WeightLog = require("../models/WeightLog");
const WorkoutPlan = require("../models/WorkoutPlan");

const router = express.Router();

router.get("/:id/full", protect, authorize("trainer", "admin"), async (req, res) => {
  try {
    const clientId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client ID format" });
    }

    const client = await User.findById(clientId).select("-password").lean();
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // 1. Header Information Calculation
    const activeSince = client.createdAt;
    const activeDays = Math.floor((Date.now() - new Date(activeSince).getTime()) / (1000 * 60 * 60 * 24));
    
    let experienceTag = "Novice";
    if (client.activityLevel === "active" || client.activityLevel === "very_active") experienceTag = "Pro";
    else if (activeDays > 60 || client.activityLevel === "moderate") experienceTag = "Active";

    const tags = [];
    if (client.preferences?.nutrition?.allergies) tags.push(`Allergies: ${client.preferences.nutrition.allergies}`);
    if (client.goal === "pcod") tags.push("Low-impact preference");
    if (client.goal === "loss" && client.activityLevel === "sedentary") tags.push("Ease-in progression");
    if (tags.length === 0) tags.push("No major constraints");

    // 2. Body Metrics (Chronological left-to-right)
    const weightLogs = await WeightLog.find({ user: clientId }).sort({ loggedAt: 1 }).lean();
    const bodyMetrics = weightLogs.map((log) => {
      const dateStr = new Date(log.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date: dateStr,
        weight: log.weight,
        bodyFat: log.bodyFat || null
      };
    });

    // 3. Workout Info Grid
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const recentPlans = await WorkoutPlan.find({ 
      user: clientId, 
      date: { $gte: ninetyDaysAgo, $lte: now } 
    }).lean();

    const heatmap = [];
    for (let i = 89; i >= 0; i--) {
       const cursor = new Date();
       cursor.setDate(now.getDate() - i);
       cursor.setHours(0,0,0,0);
       
       const cursorDateString = cursor.toISOString().slice(0, 10);
       const planOnDay = recentPlans.find(p => p.date.toISOString().slice(0, 10) === cursorDateString);
       
       heatmap.push({
         date: cursorDateString,
         status: planOnDay ? planOnDay.status : "none"
       });
    }

    // 4. Recent Sessions List
    const pastCompletedSessions = await WorkoutPlan.find({ 
      user: clientId, 
      date: { $lte: now },
      status: { $in: ["completed", "skipped"] }
    })
    .sort({ date: -1 })
    .limit(5)
    .lean();

    // 5. Next Scheduled Session
    const nextSession = await WorkoutPlan.findOne({
      user: clientId,
      date: { $gt: now },
      status: "scheduled"
    })
    .sort({ date: 1 })
    .lean();

    res.json({
      header: {
        name: client.name,
        goal: client.goal,
        activeSince: activeSince,
        experienceTag,
      },
      tags,
      bodyMetrics,
      heatmap,
      recentSessions: pastCompletedSessions.map(s => ({
        id: s._id,
        date: s.date,
        focus: s.planTitle,
        status: s.status,
        trainerNotes: s.notes
      })),
      nextSession: nextSession ? {
        id: nextSession._id,
        date: nextSession.date,
        focus: nextSession.planTitle,
      } : null
    });

  } catch (err) {
    console.error("Client API Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
