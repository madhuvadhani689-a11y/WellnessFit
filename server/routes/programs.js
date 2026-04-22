const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const WorkoutPlan = require("../models/WorkoutPlan");

const router = express.Router();

// Assign a workout properly to a client
router.post("/assign", protect, authorize("trainer", "admin"), async (req, res) => {
  try {
    const { programId, clientId } = req.body;
    
    if (!programId || !clientId) {
      return res.status(400).json({ message: "Program ID and Client ID are required." });
    }

    const plan = await WorkoutPlan.findById(programId);
    if (!plan) {
      return res.status(404).json({ message: "Program not found." });
    }

    plan.assignedTo = clientId;
    plan.assignedAt = new Date();
    plan.status = "active";
    plan.trainerId = req.user._id;

    await plan.save();

    res.json({ message: "Program assigned successfully.", plan });
  } catch (error) {
    console.error("Assign Program Error:", error);
    res.status(500).json({ message: "Server error assigning program." });
  }
});

// Clients fetch their own assigned programs
router.get("/my", protect, async (req, res) => {
  try {
    // Return all programs assigned specifically to this user
    const plans = await WorkoutPlan.find({ 
      assignedTo: req.user._id, 
      isTemplate: false 
    }).sort({ assignedAt: -1, createdAt: -1 });

    res.json({ programs: plans });
  } catch (error) {
    console.error("Fetch My Programs Error:", error);
    res.status(500).json({ message: "Server error fetching your programs." });
  }
});

module.exports = router;
