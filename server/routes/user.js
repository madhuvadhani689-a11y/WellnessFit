const router = require("express").Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// POST /api/user/connect-trainer
router.post("/connect-trainer", protect, async (req, res) => {
  try {
    const { trainerCode } = req.body;
    if (!trainerCode || trainerCode.length !== 6) {
      return res.status(400).json({ message: "Invalid trainer code. It should be 6 characters long." });
    }

    // Find all trainers then match code by looking at last 6 characters of _id
    const trainers = await User.find({ role: "trainer" });
    const trainer = trainers.find((t) => String(t._id).slice(-6) === trainerCode);

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found. Please check the code and try again." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { assignedTrainer: trainer._id },
      { new: true }
    );

    res.json({ 
      message: `Successfully connected to trainer ${trainer.name}!`,
      user 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
