const router = require("express").Router();
const User = require("../models/User");
const WorkoutPlan = require("../models/WorkoutPlan");
const WeightLog = require("../models/WeightLog");
const NutritionLog = require("../models/NutritionLog");
const PCODLog = require("../models/PCODLog");
const Gamification = require("../models/Gamification");
const { protect, authorize } = require("../middleware/auth");
const axios = require("axios");

const DAY_MS = 864e5;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const getDateValue = (value) => {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getLatestTimestamp = (items, keys) =>
  items.reduce((latest, item) => {
    const values = keys.map((key) => getDateValue(item[key]));
    return Math.max(latest, ...values);
  }, 0);

const getGoalLabel = (goal) => {
  if (goal === "gain") return "Muscle Gain";
  if (goal === "pcod") return "PCOD Care";
  return "Weight Loss";
};

const getClientStatus = (lastActivityAt) => {
  const daysAgo = (Date.now() - lastActivityAt) / DAY_MS;
  if (daysAgo <= 2) return "green";
  if (daysAgo <= 5) return "yellow";
  return "red";
};

const getSpotlightStatus = ({ lastActivityAt, adherenceScore, goal }) => {
  const daysAgo = (Date.now() - lastActivityAt) / DAY_MS;
  if (goal === "pcod" && daysAgo > 3) {
    return {
      status: "Needs recovery check",
      note: "Recent activity dropped for a PCOD care client. A quick recovery follow-up would help.",
    };
  }
  if (adherenceScore >= 85) {
    return {
      status: "Ready for progression",
      note: "Consistency is strong. This client can likely handle a refreshed plan or higher challenge.",
    };
  }
  if (daysAgo > 4) {
    return {
      status: "Missed recent logs",
      note: "There has been a gap in check-ins. A reminder or short coaching note is recommended.",
    };
  }
  return {
    status: "Needs follow-up",
    note: "Progress is moving, but this client would benefit from a personal touch this week.",
  };
};

router.get("/dashboard", protect, authorize("trainer", "admin"), async (req, res) => {
  try {
    const clientLimit = Math.min(300, Math.max(20, Number.parseInt(req.query.clientLimit, 10) || 120));
    const lookbackDays = Math.min(365, Math.max(14, Number.parseInt(req.query.lookbackDays, 10) || 90));
    const since = new Date(Date.now() - lookbackDays * DAY_MS);

    const clients = await User.find({ role: "user" })
      .select("name goal createdAt")
      .sort({ createdAt: -1 })
      .limit(clientLimit)
      .lean();

    const clientIds = clients.map((client) => client._id);

    if (!clientIds.length) {
      return res.json({
        metrics: {
          newAssessments: 0,
          activeClients: 0,
          programsDue: 0,
          checkinsPending: 0,
        },
        aiSummary: [
          { title: "Missed Workouts", value: "0", note: "No client activity yet", tone: "warn" },
          { title: "Fast Movers", value: "0", note: "No active progress data yet", tone: "good" },
          { title: "Drop-off Risk", value: "0", note: "No inactivity risk right now", tone: "risk" },
        ],
        todaySessions: [],
        heatmap: [],
        activityFeed: [],
        segments: [],
        spotlights: [],
        alerts: [],
      });
    }

    const [workouts, weights, nutritions, pcodLogs] = await Promise.all([
      WorkoutPlan.find({ user: { $in: clientIds } })
        .select("user date startTime planTitle blocks status createdAt updatedAt")
        .where("date").gte(since)
        .sort({ date: -1, createdAt: -1 })
        .lean(),
      WeightLog.find({ user: { $in: clientIds } })
        .select("user weight loggedAt createdAt")
        .where("loggedAt").gte(since)
        .sort({ loggedAt: -1 })
        .lean(),
      NutritionLog.find({ user: { $in: clientIds } })
        .select("user date totals waterLitres updatedAt createdAt")
        .where("date").gte(since)
        .sort({ date: -1 })
        .lean(),
      PCODLog.find({ user: { $in: clientIds } })
        .select("user loggedAt symptoms createdAt")
        .where("loggedAt").gte(since)
        .sort({ loggedAt: -1 })
        .lean(),
      Gamification.find({ user: { $in: clientIds } }).lean(),
    ]);

    const clientNameMap = new Map(clients.map((client) => [String(client._id), client.name]));
    const clientGoalMap = new Map(clients.map((client) => [String(client._id), client.goal]));
    const gamificationsByUser = new Map(gamificationRecords.map(g => [String(g.user), g]));

    const workoutsByUser = new Map();
    const weightsByUser = new Map();
    const nutritionByUser = new Map();
    const pcodByUser = new Map();

    for (const workout of workouts) {
      const key = String(workout.user);
      if (!workoutsByUser.has(key)) workoutsByUser.set(key, []);
      workoutsByUser.get(key).push(workout);
    }
    for (const weight of weights) {
      const key = String(weight.user);
      if (!weightsByUser.has(key)) weightsByUser.set(key, []);
      weightsByUser.get(key).push(weight);
    }
    for (const log of nutritions) {
      const key = String(log.user);
      if (!nutritionByUser.has(key)) nutritionByUser.set(key, []);
      nutritionByUser.get(key).push(log);
    }
    for (const log of pcodLogs) {
      const key = String(log.user);
      if (!pcodByUser.has(key)) pcodByUser.set(key, []);
      pcodByUser.get(key).push(log);
    }

    const clientStats = clients.map((client) => {
      const key = String(client._id);
      const userWorkouts = workoutsByUser.get(key) || [];
      const userWeights = weightsByUser.get(key) || [];
      const userNutrition = nutritionByUser.get(key) || [];
      const userPcod = pcodByUser.get(key) || [];

      const lastActivityAt = Math.max(
        getLatestTimestamp(userWorkouts, ["updatedAt", "createdAt", "date"]),
        getLatestTimestamp(userWeights, ["loggedAt", "createdAt"]),
        getLatestTimestamp(userNutrition, ["updatedAt", "createdAt", "date"]),
        getLatestTimestamp(userPcod, ["loggedAt", "createdAt"]),
        getDateValue(client.createdAt)
      );

      const completedCount = userWorkouts.filter((plan) => plan.status === "completed").length;
      const totalWorkoutCount = userWorkouts.length;
      const adherenceScore = totalWorkoutCount
        ? Math.round((completedCount / totalWorkoutCount) * 100)
        : lastActivityAt >= Date.now() - 7 * DAY_MS
          ? 72
          : 48;

      const gamification = gamificationsByUser.get(key) || { currentStreak: 0, badges: [], lastCheckInDate: null, totalSessions: 0 };
      const checkInDaysAgo = gamification.lastCheckInDate ? (Date.now() - new Date(gamification.lastCheckInDate).getTime()) / DAY_MS : Infinity;
      
      const isChurnRisk = checkInDaysAgo > 7;
      let finalStatus = isChurnRisk ? "red" : getClientStatus(lastActivityAt);

      return {
        _id: key,
        name: client.name,
        goal: client.goal,
        createdAt: client.createdAt,
        lastActivityAt,
        status: finalStatus,
        adherenceScore,
        workouts: userWorkouts,
        weights: userWeights,
        nutrition: userNutrition,
        pcod: userPcod,
        gamification
      };
    });

    const oneWeekAgo = Date.now() - 7 * DAY_MS;
    const winsThisWeek = [];
    gamificationRecords.forEach(g => {
      g.badges.forEach(b => {
        if (new Date(b.earnedAt).getTime() >= oneWeekAgo) {
          winsThisWeek.push({
            clientName: clientNameMap.get(String(g.user)) || "Client",
            badgeName: b.name,
            icon: b.icon,
            earnedAt: b.earnedAt
          });
        }
      });
    });
    winsThisWeek.sort((a,b) => new Date(b.earnedAt) - new Date(a.earnedAt));

    const activeClients = clientStats.filter((client) => client.lastActivityAt >= Date.now() - 7 * DAY_MS).length;
    const newAssessments = clientStats.filter((client) => {
      const hasStarted = client.workouts.length || client.weights.length || client.nutrition.length || client.pcod.length;
      return !hasStarted || getDateValue(client.createdAt) >= Date.now() - 14 * DAY_MS;
    }).length;
    const programsDue = clientStats.filter((client) => {
      const nextPlan = client.workouts.find((plan) => getDateValue(plan.date) >= startOfToday().getTime());
      return !nextPlan;
    }).length;
    const checkinsPending = clientStats.filter((client) => client.lastActivityAt < Date.now() - 3 * DAY_MS).length;

    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const todaySessions = workouts
      .filter((plan) => {
        const time = getDateValue(plan.date);
        return time >= todayStart.getTime() && time <= todayEnd.getTime();
      })
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
      .slice(0, 5)
      .map((plan) => ({
        time: plan.startTime,
        client: clientNameMap.get(String(plan.user)) || "Client",
        focus: plan.blocks?.[1]?.title || plan.planTitle || "Planned session",
      }));

    const sortedByActivity = [...clientStats].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    const heatmap = sortedByActivity.slice(0, 9).map((client) => ({
      name: client.name.split(" ")[0],
      status: client.status,
    }));

    const segments = ["loss", "gain", "pcod"].map((goal) => {
      const count = clientStats.filter((client) => client.goal === goal).length;
      const note =
        goal === "loss"
          ? "Highest demand this week"
          : goal === "gain"
            ? "Strength plans due for active clients"
            : "Recovery-focused coaching active";
      return { name: getGoalLabel(goal), count, note };
    });

    const spotlights = [...clientStats]
      .sort((a, b) => b.adherenceScore - a.adherenceScore || b.lastActivityAt - a.lastActivityAt)
      .slice(0, 3)
      .map((client) => {
        const spotlight = getSpotlightStatus(client);
        return {
          _id: client._id,
          name: client.name,
          goal: getGoalLabel(client.goal),
          adherence: `${client.adherenceScore}%`,
          status: spotlight.status,
          note: spotlight.note,
        };
      });

    const activityFeed = [
      ...workouts.slice(0, 6).map((plan) => ({
        timeValue: Math.max(getDateValue(plan.updatedAt), getDateValue(plan.createdAt)),
        text:
          plan.status === "completed"
            ? `${clientNameMap.get(String(plan.user)) || "Client"} completed ${plan.planTitle}`
            : plan.status === "skipped"
              ? `${clientNameMap.get(String(plan.user)) || "Client"} skipped ${plan.planTitle}`
              : `${clientNameMap.get(String(plan.user)) || "Client"} received ${plan.planTitle}`,
        type: plan.status === "completed" ? "good" : plan.status === "skipped" ? "warn" : "good",
      })),
      ...weights.slice(0, 4).map((log) => ({
        timeValue: Math.max(getDateValue(log.loggedAt), getDateValue(log.createdAt)),
        text: `${clientNameMap.get(String(log.user)) || "Client"} logged weight ${log.weight} kg`,
        type: "good",
      })),
      ...pcodLogs.slice(0, 4).map((log) => ({
        timeValue: Math.max(getDateValue(log.loggedAt), getDateValue(log.createdAt)),
        text: `${clientNameMap.get(String(log.user)) || "Client"} updated PCOD tracker`,
        type: clientGoalMap.get(String(log.user)) === "pcod" ? "risk" : "good",
      })),
      ...nutritions.slice(0, 4).map((log) => ({
        timeValue: Math.max(getDateValue(log.updatedAt), getDateValue(log.createdAt), getDateValue(log.date)),
        text: `${clientNameMap.get(String(log.user)) || "Client"} logged nutrition for the day`,
        type: "good",
      })),
    ]
      .sort((a, b) => b.timeValue - a.timeValue)
      .slice(0, 6)
      .map((item) => {
        const minutesAgo = Math.max(1, Math.round((Date.now() - item.timeValue) / 60000));
        const time =
          minutesAgo < 60
            ? `${minutesAgo} min ago`
            : `${Math.round(minutesAgo / 60)} hr ago`;
        return { time, text: item.text, type: item.type };
      });

    const alerts = [];
    if (checkinsPending > 0) alerts.push(`${checkinsPending} clients have been inactive for more than 3 days.`);
    if (programsDue > 0) alerts.push(`${programsDue} clients do not have an upcoming workout plan.`);
    const pcodDropoff = clientStats.filter((client) => client.goal === "pcod" && client.lastActivityAt < Date.now() - 3 * DAY_MS).length;
    if (pcodDropoff > 0) alerts.push(`${pcodDropoff} PCOD care clients need recovery-focused follow-up.`);
    if (!alerts.length) alerts.push("All tracked clients have recent activity and current plans.");

    res.json({
      metrics: {
        newAssessments,
        activeClients,
        programsDue,
        checkinsPending,
      },
      aiSummary: [
        { title: "Missed Workouts", value: String(workouts.filter((plan) => plan.status === "skipped").length), note: "Clients skipped today's assigned or recent session", tone: "warn" },
        { title: "Fast Movers", value: String(clientStats.filter((client) => client.adherenceScore >= 85).length), note: "Clients are ready for intensity progression", tone: "good" },
        { title: "Drop-off Risk", value: String(clientStats.filter((client) => client.status === "red").length), note: "0 sessions in 7 days - Churn Risk limit reached", tone: "risk" },
      ],
      todaySessions,
      heatmap,
      activityFeed,
      segments,
      spotlights,
      alerts,
      winsThisWeek,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trainer/clients/:trainerId
router.get("/clients/:trainerId", protect, authorize("trainer", "admin"), async (req, res) => {
  try {
    const clients = await User.find({
      role: "user",
      assignedTrainer: req.params.trainerId,
    }).lean();

    let clientList = clients;
    if (clientList.length === 0) {
      clientList = await User.find({ role: "user" }).lean();
    }

    const clientIds = clientList.map((c) => c._id);
    const [weights, pcodLogs] = await Promise.all([
      WeightLog.find({ user: { $in: clientIds } }).sort({ loggedAt: -1 }).lean(),
      PCODLog.find({ user: { $in: clientIds } }).sort({ loggedAt: -1 }).lean()
    ]);

    const result = clientList.map((client) => {
      const clientWeights = weights.filter((w) => String(w.user) === String(client._id));
      const clientPcodLogs = pcodLogs.filter((p) => String(p.user) === String(client._id));
      
      const currentWeight = clientWeights.length > 0 ? clientWeights[0].weight : (client.targetWeight ? client.targetWeight + 5 : "N/A");
      const lastPcod = clientPcodLogs.length > 0 ? clientPcodLogs[0] : null;
      
      const cycleDay = lastPcod && lastPcod.cycleDay ? `Day ${lastPcod.cycleDay}` : "N/A";
      const cyclePhase = lastPcod && lastPcod.phase ? lastPcod.phase : "N/A";
      
      const lastLogDate = clientWeights.length > 0 ? clientWeights[0].loggedAt : client.createdAt;

      return {
        _id: client._id,
        name: client.name,
        email: client.email,
        fitnessGoal: client.goal,
        currentWeight,
        targetWeight: client.targetWeight || "N/A",
        cycleDay,
        cyclePhase,
        lastLogDate,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trainer/generate-program
router.post("/generate-program", protect, authorize("trainer", "admin"), async (req, res) => {
  try {
    const { userId, date, startTime, endTime, intensity, notes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "Client ID (userId) is required" });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (totalMinutes <= 0 || totalMinutes > 180) {
      return res.status(400).json({ message: 'Invalid time range' });
    }

    const client = await User.findById(userId).select("name goal");
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const variations = [
      'Focus on lower body strength',
      'Focus on upper body and core', 
      'Full body HIIT style',
      'Low impact steady state',
      'Mobility and flexibility focus',
      'Cardio dominant session',
      'Strength circuit format',
      'Interval training style'
    ];
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];

    const promptText = `
You are a PCOD-specialized fitness trainer.
Create a ${totalMinutes}-minute workout session.

Client: ${client.name}
Goal: ${client.goal}
Intensity: ${intensity}
Session variation: ${randomVariation}
Coach notes: ${notes || 'none'}
Time: ${startTime} to ${endTime} (${totalMinutes} mins total)

Rules:
1. Total exercise time must EXACTLY equal ${totalMinutes} minutes
2. Always start with Warmup (5 min)
3. Always end with Cooldown (5 min)  
4. Middle exercises fill remaining ${totalMinutes - 10} minutes
5. Each session must be DIFFERENT based on variation
6. If PCOD goal: avoid heavy jumping, include breathing exercises
7. Session name must reflect the variation chosen

Return ONLY valid JSON (no markdown):
{
  "sessionName": "unique name based on variation",
  "totalMinutes": ${totalMinutes},
  "blocks": [
    {
      "name": "exercise name",
      "description": "how to do it",
      "duration": minutes_as_number
    }
  ]
}
Blocks duration must sum to exactly ${totalMinutes}.
`;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({
         sessionName: "Fallback: " + randomVariation,
         totalMinutes,
         blocks: [
           { name: "Warmup", description: "General mobility", duration: 5 },
           { name: "Main Circuit", description: `Focusing on: ${randomVariation}`, duration: totalMinutes - 10 },
           { name: "Cooldown", description: "Stretching", duration: 5 }
         ]
      });
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: promptText }]
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
    const plan = JSON.parse(cleaned);

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trainer/save-program
router.post("/save-program", protect, authorize("trainer", "admin"), async (req, res) => {
  try {
    const { userId, sessionName, blocks, date, startTime, endTime, totalMinutes, intensity } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "Client ID (userId) is required" });
    }

    const formattedBlocks = (blocks || []).map(b => ({
      title: b.name || "Exercise",
      instructions: b.description || "",
      durationMin: b.duration || 5
    }));

    const newPlan = await WorkoutPlan.create({
      user: userId,
      trainerId: req.user._id,
      assignedByTrainer: true,
      date: new Date(date),
      startTime,
      endTime,
      availableMinutes: totalMinutes || 30,
      intensity: intensity || "moderate",
      planTitle: sessionName || "Generated Workout",
      blocks: formattedBlocks,
      status: "scheduled"
    });

    res.status(201).json({ success: true, message: 'Program saved!', plan: newPlan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
