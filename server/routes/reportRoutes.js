const express = require("express");
const PDFDocument = require("pdfkit");
const User = require("../models/User");
const PCODLog = require("../models/PCODLog");
const WeightLog = require("../models/WeightLog");
const NutritionLog = require("../models/NutritionLog");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/export-report", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [pcodLogs, weightLogs, nutritionLogs] = await Promise.all([
      PCODLog.find({ user: userId, loggedAt: { $gte: ninetyDaysAgo } }).sort({ loggedAt: -1 }).lean(),
      WeightLog.find({ user: userId, date: { $gte: ninetyDaysAgo } }).sort({ date: 1 }).lean(),
      NutritionLog.find({ user: userId, date: { $gte: ninetyDaysAgo } }).sort({ date: -1 }).lean()
    ]);

    const periodStarts = pcodLogs.filter(l => l.periodStartDate).map(l => l.periodStartDate);
    let avgLength = "N/A";
    if (periodStarts.length >= 2) {
      let diffs = [];
      for (let i = 0; i < periodStarts.length - 1; i++) {
        diffs.push((new Date(periodStarts[i]) - new Date(periodStarts[i+1])) / (1000 * 60 * 60 * 24));
      }
      avgLength = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) + " days";
    }

    const symCounts = {};
    pcodLogs.forEach(log => {
      log.symptoms?.forEach(s => {
        symCounts[s.name] = (symCounts[s.name] || 0) + 1;
      });
    });
    const topSymptoms = Object.entries(symCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

    const startWeight = weightLogs.length > 0 ? weightLogs[0].weightKg : (user.startingWeight || "Unknown");
    const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weightKg : "Unknown";
    const goalWeight = user.targetWeight || "Not set";

    const foodsTracked = new Set();
    nutritionLogs.forEach(log => {
      ['breakfast', 'lunch', 'snack', 'dinner'].forEach(meal => {
        log.meals?.[meal]?.forEach(f => {
          if (f.name) foodsTracked.add(f.name);
        });
      });
    });
    const topFoods = Array.from(foodsTracked).slice(0, 15).join(", ");

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=WellnessSummary.pdf");
    doc.pipe(res);

    doc.fontSize(24).fillColor("#3d5a3e").text("My Wellness Summary — WellnessFit", { align: "center" }).moveDown();
    doc.fontSize(14).fillColor("#333").text(`Name: ${user.name || "User"}`);
    doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`).moveDown(2);

    doc.fontSize(18).fillColor("#a8c5a0").text("My Cycle Overview").moveDown(0.5);
    doc.fontSize(12).fillColor("#333").text(`Average Cycle Length: ${avgLength}`);
    doc.text(`Last ${Math.min(3, periodStarts.length)} Cycle Start Dates:`).moveDown(0.5);
    periodStarts.slice(0, 3).forEach(date => {
      doc.text(`• ${new Date(date).toLocaleDateString('en-IN')}`);
    });
    doc.moveDown();

    doc.fontSize(18).fillColor("#a8c5a0").text("Top 5 Symptoms Logged").moveDown(0.5);
    if (topSymptoms.length === 0) doc.fontSize(12).fillColor("#666").text("No symptoms logged recently.");
    topSymptoms.forEach(([name, count]) => {
      doc.fontSize(12).fillColor("#333").text(`• ${name} (${count} times)`);
    });

    doc.addPage();

    doc.fontSize(18).fillColor("#a8c5a0").text("Weight Journey").moveDown(0.5);
    doc.fontSize(12).fillColor("#333").text(`Starting Weight: ${startWeight} kg`);
    doc.text(`Current Weight: ${currentWeight} kg`);
    doc.text(`Target Goal: ${goalWeight} kg`).moveDown(2);

    doc.fontSize(18).fillColor("#a8c5a0").text("Foods Recently Tracked").moveDown(0.5);
    doc.fontSize(12).fillColor("#333").text(topFoods || "No recent food logs.", { width: 450, lineGap: 4 });

    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).fillColor("#aaaaaa").text("Your personal wellness journey · WellnessFit", 50, doc.page.height - 50, { align: "center" });
    }

    doc.end();

  } catch (err) {
    console.error("PDF Export error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Could not generate summary" });
    }
  }
});

module.exports = router;
