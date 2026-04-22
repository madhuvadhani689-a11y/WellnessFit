const router    = require("express").Router();
const WeightLog = require("../models/WeightLog");
const User      = require("../models/User");
const { protect } = require("../middleware/auth");
const { calculateBmi } = require("../utils/bmi");

// Helpers
const dayRange = (date = new Date()) => {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value || 0)));

// POST /api/weight  – log new weight
router.post("/", protect, async (req, res) => {
  try {
    const { weight, bodyFat, muscleMass, notes } = req.body;
    const numericWeight = Number(weight);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      return res.status(400).json({ message: "Please provide valid weight and height values." });
    }

    const user = await User.findById(req.user._id);

    let bmi;
    let bmiCategory;
    if (user.heightCm) {
      const result = calculateBmi({ weightKg: numericWeight, height: user.heightCm });
      bmi = result.bmi;
      bmiCategory = result.category;
    }

    const log = await WeightLog.create({
      user: req.user._id, weight: numericWeight, bmi, bodyFat, muscleMass, notes,
    });

    // Save starting weight on first log
    if (!user.startingWeight) {
      user.startingWeight = numericWeight;
      await user.save();
    }

    res.status(201).json({ log, bmi: bmi != null ? { value: bmi, category: bmiCategory } : null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/weight?period=1W|1M|3M|ALL  – history + stats
router.get("/", protect, async (req, res) => {
  try {
    const periodMap = {
      "1W": 7, "1M": 30, "3M": 90,
    };
    const days  = periodMap[req.query.period];
    const query = { user: req.user._id };
    if (days) query.loggedAt = { $gte: new Date(Date.now() - days * 864e5) };

    const logs = await WeightLog.find(query).sort({ loggedAt: -1 }).limit(100);

    const stats = logs.length
      ? {
          latest: logs[0].weight,
          oldest: logs[logs.length - 1].weight,
          change: +(logs[0].weight - logs[logs.length - 1].weight).toFixed(1),
          count:  logs.length,
        }
      : {};

    res.json({ logs, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/weight/progress - persisted progress summary for UI cards
router.get("/progress", protect, async (req, res) => {
  try {
    const [user, logs] = await Promise.all([
      User.findById(req.user._id).select("startingWeight targetWeight"),
      WeightLog.find({ user: req.user._id }).sort({ loggedAt: -1 }).limit(2000),
    ]);

    const latestLog = logs[0] || null;
    const oldestLog = logs[logs.length - 1] || null;

    const currentWeight = Number(latestLog?.weight ?? user?.startingWeight ?? 0);
    const startWeight = Number(user?.startingWeight ?? oldestLog?.weight ?? currentWeight ?? 0);
    const targetWeight = user?.targetWeight != null ? Number(user.targetWeight) : null;

    const trackedDates = new Set(
      logs
        .map((log) => new Date(log.loggedAt).toISOString().slice(0, 10))
        .filter(Boolean)
    );

    const firstLogDate = oldestLog ? new Date(oldestLog.loggedAt) : null;
    const today = new Date();
    const daysTracked = firstLogDate
      ? Math.max(1, Math.ceil((today - firstLogDate) / 864e5) + 1)
      : 0;

    let direction = "maintain";
    if (targetWeight != null) {
      if (targetWeight > startWeight) direction = "gain";
      else if (targetWeight < startWeight) direction = "loss";
    }

    let progressPercent = 0;
    let remainingKg = 0;

    if (targetWeight != null && targetWeight !== startWeight) {
      if (direction === "gain") {
        progressPercent = clampPercent(((currentWeight - startWeight) / (targetWeight - startWeight)) * 100);
        remainingKg = Math.max(0, Number((targetWeight - currentWeight).toFixed(2)));
      } else if (direction === "loss") {
        progressPercent = clampPercent(((startWeight - currentWeight) / (startWeight - targetWeight)) * 100);
        remainingKg = Math.max(0, Number((currentWeight - targetWeight).toFixed(2)));
      }
    }

    const changeSinceStartKg = Number((currentWeight - startWeight).toFixed(2));

    res.json({
      progress: {
        currentWeight: Number(currentWeight.toFixed(2)),
        startWeight: Number(startWeight.toFixed(2)),
        targetWeight: targetWeight == null ? null : Number(targetWeight.toFixed(2)),
        direction,
        progressPercent: Number(progressPercent.toFixed(0)),
        changeSinceStartKg,
        remainingKg,
        daysTracked,
        loggedDays: trackedDates.size,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/weight/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const log = await WeightLog.findOneAndDelete({
      _id: req.params.id, user: req.user._id,
    });
    if (!log) return res.status(404).json({ message: "Log not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
