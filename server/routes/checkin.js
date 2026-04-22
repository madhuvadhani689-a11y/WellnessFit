const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { processCheckIn } = require("../services/badgeService");
const Gamification = require("../models/Gamification");

// POST /api/checkins/:id/complete
router.post("/:id/complete", protect, async (req, res) => {
  try {
    const { date, hitTargetGoal } = req.body;
    const checkDate = date ? new Date(date) : new Date();
    
    // We update streak and potentially award badges
    const { gamification, newBadges } = await processCheckIn(req.user._id, checkDate, hitTargetGoal);

    res.json({ gamification, newBadges, message: "Check-in complete" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/checkins/stats
router.get("/stats", protect, async (req, res) => {
  try {
    let gamification = await Gamification.findOne({ user: req.user._id });
    if (!gamification) {
      gamification = { currentStreak: 0, longestStreak: 0, totalSessions: 0, badges: [] };
    }
    res.json({ gamification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
