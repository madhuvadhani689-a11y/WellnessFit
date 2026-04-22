const router = require("express").Router();
const WorkoutPlan = require("../models/WorkoutPlan");
const User = require("../models/User");
const WorkoutReminderLog = require("../models/WorkoutReminderLog");
const { protect } = require("../middleware/auth");

const GOAL_LIBRARY = {
  loss: {
    baseTitle: "Fat-Burn",
    short: [
      { title: "Fast Walk Activation", instructions: "Raise heart rate gradually with a brisk walk and arm drive." },
      { title: "Metabolic Circuit", instructions: "Alternate squats, step jacks, and incline pushups without long rest." },
      { title: "Core Finisher", instructions: "Use plank holds and controlled knee drives to finish strong." },
    ],
    medium: [
      { title: "Cardio Ramp-Up", instructions: "Build pace through light jogging or marching intervals." },
      { title: "Bodyweight Conditioning", instructions: "Rotate lunges, squat pulses, and pushups in timed rounds." },
      { title: "Core Burn", instructions: "Use dead bugs, mountain climbers, and side planks for trunk control." },
      { title: "Low-Impact Burnout", instructions: "Keep moving with step touch, punches, and mini squat holds." },
    ],
    long: [
      { title: "Endurance Walk / Jog", instructions: "Set a sustainable pace and hold steady breathing." },
      { title: "Lower-Body Burner", instructions: "Use lunges, squats, and glute work with short rest." },
      { title: "Upper + Core Mix", instructions: "Blend pushups, rows, and anti-rotation core work." },
      { title: "Conditioning Ladder", instructions: "Work in progressive intervals to lift effort gradually." },
      { title: "Mobility Reset", instructions: "Recover with dynamic stretches between harder phases." },
    ],
  },
  gain: {
    baseTitle: "Strength Build",
    short: [
      { title: "Activation Warm Set", instructions: "Prime joints and muscles with band-free activation." },
      { title: "Compound Strength Block", instructions: "Focus on squats, push patterns, and controlled tempo reps." },
      { title: "Accessory Finisher", instructions: "Finish with calf raises, split squats, and core bracing." },
    ],
    medium: [
      { title: "Dynamic Warmup", instructions: "Prepare hips, shoulders, and trunk before loading effort." },
      { title: "Strength Set A", instructions: "Prioritize bigger compound patterns with longer control." },
      { title: "Strength Set B", instructions: "Support the main lift with unilateral accessory work." },
      { title: "Core Stability", instructions: "Use planks and carries to reinforce posture." },
    ],
    long: [
      { title: "Mobility + Prep", instructions: "Open hips, shoulders, and ankles before the main sets." },
      { title: "Primary Strength Block", instructions: "Work on your heaviest quality movements first." },
      { title: "Secondary Volume Block", instructions: "Accumulate extra reps for balanced muscle stimulus." },
      { title: "Accessory Isolation", instructions: "Add focused work for glutes, arms, or upper back." },
      { title: "Breath-Led Stretch", instructions: "Cool down to support recovery and reduce stiffness." },
    ],
  },
  pcod: {
    baseTitle: "Hormone-Balance",
    short: [
      { title: "Gentle Cardio Start", instructions: "Use low-impact steps or cycling to ease into movement." },
      { title: "Core Stability Flow", instructions: "Prioritize pelvic stability, breathing, and posture." },
      { title: "Relaxation Finish", instructions: "End with calming stretches and long exhales." },
    ],
    medium: [
      { title: "Low-Impact Cardio", instructions: "Walk or cycle at a conversational pace." },
      { title: "Pilates Stability", instructions: "Control the tempo and focus on alignment." },
      { title: "Stress-Relief Yoga Flow", instructions: "Use smooth transitions with extended breathing." },
      { title: "Mobility Reset", instructions: "Release hips, lower back, and shoulders gently." },
    ],
    long: [
      { title: "Mobility Wake-Up", instructions: "Start with relaxed joint mobility and diaphragmatic breathing." },
      { title: "Steady Cardio Phase", instructions: "Hold a calm, sustainable low-impact rhythm." },
      { title: "Pilates + Core Control", instructions: "Build stability without spiking fatigue." },
      { title: "Yoga Recovery Flow", instructions: "Move through restorative poses with long exhale cues." },
      { title: "Relaxation Cooldown", instructions: "Lower stress load with slow stretches and stillness." },
    ],
  },
};

const ZUMBA_LIBRARY = {
  light: [
    { title: "Beginner Zumba Basics", url: "https://www.youtube.com/results?search_query=beginner+zumba+15+minutes", durationMin: 15, focus: "Low-impact full body" },
    { title: "Easy Zumba Dance Cardio", url: "https://www.youtube.com/results?search_query=easy+zumba+dance+20+minutes", durationMin: 20, focus: "Steady cardio flow" },
    { title: "Gentle Latin Cardio", url: "https://www.youtube.com/results?search_query=gentle+latin+dance+cardio+12+minutes", durationMin: 12, focus: "Mobility + rhythm" },
  ],
  moderate: [
    { title: "30-Min Zumba Cardio Session", url: "https://www.youtube.com/results?search_query=zumba+cardio+30+minutes", durationMin: 30, focus: "Cardio endurance" },
    { title: "Zumba Fat Burn Dance", url: "https://www.youtube.com/results?search_query=zumba+fat+burn+25+minutes", durationMin: 25, focus: "Fat-burn intervals" },
    { title: "Latin Dance HIIT Lite", url: "https://www.youtube.com/results?search_query=latin+dance+hiit+20+minutes", durationMin: 20, focus: "Core + legs" },
  ],
  high: [
    { title: "High-Energy Zumba HIIT", url: "https://www.youtube.com/results?search_query=high+energy+zumba+hiit+30+minutes", durationMin: 30, focus: "High-intensity cardio" },
    { title: "Power Zumba Sweat Session", url: "https://www.youtube.com/results?search_query=power+zumba+28+minutes", durationMin: 28, focus: "Explosive full body" },
    { title: "Zumba Advanced Intervals", url: "https://www.youtube.com/results?search_query=zumba+advanced+intervals+35+minutes", durationMin: 35, focus: "Intervals + endurance" },
  ],
};

const GOAL_FOCUS = {
  loss: "calorie burn",
  gain: "conditioning",
  pcod: "hormone-friendly low impact",
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

const toMinutes = (hhmm) => {
  const m = hhmm.match(HHMM);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

const parseDateOnly = (value) => {
  if (!YYYYMMDD.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeReminderTime = (value) => {
  const input = String(value || "").trim();
  return HHMM.test(input) ? input : null;
};

const splitDurations = (availableMinutes, intensity) => {
  const warmup = availableMinutes >= 25 ? 5 : 3;
  const cooldown = availableMinutes >= 25 ? 5 : 3;
  let main = availableMinutes - warmup - cooldown;

  if (main < 10) main = 10;

  const segments =
    main <= 20 ? 2 :
    main <= 35 ? 3 : 4;

  const base = Math.floor(main / segments);
  const rem = main % segments;

  const mainDurations = Array.from({ length: segments }, (_, i) => base + (i < rem ? 1 : 0));

  if (intensity === "light") {
    return { warmup: warmup + 1, cooldown: cooldown + 1, mainDurations };
  }
  if (intensity === "high") {
    return { warmup: Math.max(2, warmup - 1), cooldown, mainDurations };
  }
  return { warmup, cooldown, mainDurations };
};

const getTimeBucket = (startMinutes) =>
  startMinutes < 600 ? "morning" : startMinutes < 1020 ? "daytime" : "evening";

const getDurationBucket = (availableMinutes) =>
  availableMinutes <= 35 ? "short" : availableMinutes <= 70 ? "medium" : "long";

const getSessionTitle = ({ goal, timeBucket, durationBucket, intensity }) => {
  const base = GOAL_LIBRARY[goal]?.baseTitle || "Workout";
  const timeLabel = timeBucket === "morning" ? "Morning" : timeBucket === "daytime" ? "Midday" : "Evening";
  const durationLabel = durationBucket === "short" ? "Express" : durationBucket === "medium" ? "Focused" : "Extended";
  const intensityLabel = intensity === "light" ? "Light" : intensity === "high" ? "Power" : "Balanced";
  return `${timeLabel} ${durationLabel} ${base} ${intensityLabel}`.trim();
};

const tuneBlockForContext = ({ title, instructions, timeBucket, intensity, index, total }) => {
  let nextTitle = title;
  let nextInstructions = instructions;

  if (timeBucket === "morning" && index === 0) {
    nextTitle = title.includes("Warm") ? title : `Wake-Up ${title}`;
    nextInstructions = `${instructions} Keep the first minutes easy to wake up the body.`;
  }

  if (timeBucket === "evening" && index === total - 1) {
    nextTitle = title.includes("Recovery") || title.includes("Cooldown") ? title : `${title} Recovery`;
    nextInstructions = `${instructions} Ease the nervous system down for the evening.`;
  }

  if (intensity === "high" && !title.toLowerCase().includes("cooldown")) {
    nextInstructions = `${nextInstructions} Work in sharper intervals and keep rest brief.`;
  } else if (intensity === "light" && !title.toLowerCase().includes("cooldown")) {
    nextInstructions = `${nextInstructions} Keep effort smooth and conversational throughout.`;
  }

  return { title: nextTitle, instructions: nextInstructions };
};

const buildPlan = ({ goal, availableMinutes, intensity, startTime }) => {
  const lib = GOAL_LIBRARY[goal] || GOAL_LIBRARY.loss;
  const { warmup, cooldown, mainDurations } = splitDurations(availableMinutes, intensity);
  const startMins = toMinutes(startTime) || 0;
  const timeBucket = getTimeBucket(startMins);
  const durationBucket = getDurationBucket(availableMinutes);
  const blockPool = lib[durationBucket] || lib.medium;

  const blocks = [{ title: "Warmup", durationMin: warmup, instructions: "Prepare body and breathing." }];
  for (let i = 0; i < mainDurations.length; i += 1) {
    const item = blockPool[i % blockPool.length];
    const tuned = tuneBlockForContext({
      title: item.title,
      instructions: item.instructions,
      timeBucket,
      intensity,
      index: i,
      total: mainDurations.length,
    });
    blocks.push({ title: tuned.title, durationMin: mainDurations[i], instructions: tuned.instructions });
  }
  blocks.push({ title: "Cooldown", durationMin: cooldown, instructions: "Bring heart rate down with stretches." });

  const timeHint = timeBucket === "morning" ? "morning" : timeBucket === "daytime" ? "daytime" : "evening";
  const analysis = `Built for a ${availableMinutes}-minute ${timeHint} slot, this ${intensity}-intensity ${durationBucket} session shifts its focus to match your timing, energy, and ${goal} goal.`;

  const pool = ZUMBA_LIBRARY[intensity] || ZUMBA_LIBRARY.moderate;
  const ranked = pool
    .map((item) => ({ item, delta: Math.abs(item.durationMin - Math.min(availableMinutes, 35)) }))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 2)
    .map(({ item }) => ({
      ...item,
      focus: `${item.focus} | Best for ${GOAL_FOCUS[goal] || "overall fitness"}`,
    }));

  return {
    planTitle: getSessionTitle({ goal, timeBucket, durationBucket, intensity }),
    analysis,
    blocks,
    zumbaSessions: ranked,
  };
};

// POST /api/workout/plan
router.post("/plan", protect, async (req, res) => {
  try {
    const { date, startTime, endTime, intensity = "moderate", notes = "" } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: "date, startTime and endTime are required" });
    }
    if (!["light", "moderate", "high"].includes(intensity)) {
      return res.status(400).json({ message: "Invalid intensity value" });
    }
    if (!HHMM.test(startTime) || !HHMM.test(endTime)) {
      return res.status(400).json({ message: "Time format must be HH:MM (24-hour)" });
    }
    const plannedDate = parseDateOnly(date);
    if (!plannedDate) {
      return res.status(400).json({ message: "Date format must be YYYY-MM-DD" });
    }

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    const overnight = end <= start;
    const adjustedEnd = overnight ? end + 1440 : end;

    const availableMinutes = adjustedEnd - start;
    if (availableMinutes < 15) {
      return res.status(400).json({ message: "Minimum free slot is 15 minutes" });
    }
    if (availableMinutes > 180) {
      return res.status(400).json({ message: "Maximum free slot is 180 minutes. Please choose a shorter range." });
    }

    const { planTitle, analysis, blocks, zumbaSessions } = buildPlan({
      goal: req.user.goal || "loss",
      availableMinutes,
      intensity,
      startTime,
    });

    const scheduled = await WorkoutPlan.create({
      user: req.user._id,
      date: plannedDate,
      startTime,
      endTime,
      availableMinutes,
      goal: req.user.goal || "loss",
      intensity,
      planTitle,
      analysis,
      blocks,
      zumbaSessions,
      notes,
    });

    res.status(201).json({ plan: scheduled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workout/schedule?days=14
router.get("/schedule", protect, async (req, res) => {
  try {
    const days = Number.parseInt(req.query.days, 10) || 14;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + days * 864e5);

    const plans = await WorkoutPlan.find({
      user: req.user._id,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1, startTime: 1 });

    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workout/history?minutes=45&limit=10
router.get("/history", protect, async (req, res) => {
  try {
    const limit = Math.min(50, Number.parseInt(req.query.limit, 10) || 10);
    const minutes = Number.parseInt(req.query.minutes, 10);
    const query = { user: req.user._id };

    if (Number.isFinite(minutes) && minutes > 0) {
      query.availableMinutes = minutes;
    }

    const plans = await WorkoutPlan.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/workout/:id/status
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["scheduled", "completed", "skipped"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const plan = await WorkoutPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: "Workout plan not found" });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workout/reminder
router.get("/reminder", protect, async (req, res) => {
  try {
    const notifications = req.user.preferences?.notifications || {};
    res.json({
      reminder: {
        enabled: notifications.workoutEnabled === true,
        time: normalizeReminderTime(notifications.workoutTime) || "18:00",
        lastTriggeredAt: notifications.workoutLastTriggeredAt || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/workout/reminder
router.put("/reminder", protect, async (req, res) => {
  try {
    const enabled = req.body.enabled === true;
    const time = normalizeReminderTime(req.body.time);
    if (!time) {
      return res.status(400).json({ message: "Reminder time must be HH:MM (24-hour)." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "preferences.notifications.workoutEnabled": enabled,
          "preferences.notifications.workoutTime": time,
        },
      },
      { new: true }
    ).select("preferences.notifications");

    const notifications = user?.preferences?.notifications || {};
    res.json({
      reminder: {
        enabled: notifications.workoutEnabled === true,
        time: normalizeReminderTime(notifications.workoutTime) || time,
        lastTriggeredAt: notifications.workoutLastTriggeredAt || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workout/reminder/logs?limit=20
router.get("/reminder/logs", protect, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const logs = await WorkoutReminderLog.find({ user: req.user._id })
      .sort({ scheduledFor: -1 })
      .limit(limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
