const express = require("express");
const axios = require("axios");
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/User");
const WorkoutPlan = require("../models/WorkoutPlan");
const PCODLog = require("../models/PCODLog");

const router = express.Router();

router.post("/trainer-chat", protect, authorize("trainer", "admin"), async (req, res) => {
  try {
    const { clientId, message, conversationHistory = [] } = req.body;
    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    const client = await User.findById(clientId).select("name goal preferences gender age");
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Formulate Context
    const lastPcod = await PCODLog.findOne({ user: clientId }).sort({ loggedAt: -1 }).lean();
    const lastWorkouts = await WorkoutPlan.find({ user: clientId, status: "completed" })
      .sort({ date: -1 })
      .limit(3)
      .lean();

    const workoutContext = lastWorkouts.map((w, i) => `Session ${i+1}: ${w.planTitle}. Notes: ${w.notes || "None"}`).join('\n');
    const symptomContext = lastPcod ? `Cycle Phase: ${lastPcod.phase || "Unknown"}, Day: ${lastPcod.cycleDay || "Unknown"}. Symptoms: ${lastPcod.symptoms?.map(s => s.name).join(", ") || "None recorded"}.` : "No conditions logged.";

    const systemPrompt = `You are an expert fitness coach AI assisting a human trainer. 
You are giving advice regarding their client: ${client.name}.
Client Goal: ${client.goal} 
Latest Health Context: ${symptomContext}
Last 3 Sessions Progress:
${workoutContext || "No completed sessions yet."}

Respond directly to the trainer's question in short actionable bullets.

If the trainer asks you to create or suggest a specific workout program, ALWAYS append a JSON block AT THE VERY END of your response inside a block wrapped with \`\`\`json and \`\`\`. This JSON block MUST have this exact schema:
{
  "workoutSuggested": true,
  "sessionName": "Name of the workout",
  "totalMinutes": 30,
  "intensity": "moderate",
  "notes": "Trainer notes",
  "blocks": [
     { "title": "Warmup", "instructions": "how to do it", "durationMin": 5 },
     { "title": "Main effort", "instructions": "how to do it", "durationMin": 20 },
     { "title": "Cooldown", "instructions": "how to do it", "durationMin": 5 }
  ]
}
The 'blocks' durations MUST sum exactly to 'totalMinutes'. ALWAYS START WITH warmup. ALWAYS END WITH cooldown.
Only include the JSON if you are explicitly suggesting a workout. 
Do NOT output JSON if you are just answering a general question.`;

    const messages = conversationHistory.concat([{ role: "user", content: message }]);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({
        content: `I would love to help you build a plan for ${client.name}, but my API key is missing. As a fallback, here is a mock workout suggestion! \n\n\`\`\`json\n{\n  "workoutSuggested": true,\n  "sessionName": "Fallback Circuit",\n  "totalMinutes": 30,\n  "intensity": "moderate",\n  "notes": "Recover and reset",\n  "blocks": [\n    { "title": "Warmup", "instructions": "Standard prep", "durationMin": 5 },\n    { "title": "Core flow", "instructions": "Keep it steady", "durationMin": 20 },\n    { "title": "Cooldown", "instructions": "Breathe", "durationMin": 5 }\n  ]\n}\n\`\`\``
      });
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        system: systemPrompt,
        max_tokens: 1500,
        messages: messages
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ content: response.data.content[0].text });
  } catch (err) {
    console.error("AI Trainer Chat Error:", err.message);
    res.status(500).json({ content: "Sorry, an internal error occurred: " + err.message });
  }
});

module.exports = router;
