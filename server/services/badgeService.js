const Gamification = require("../models/Gamification");

const BADGE_DEFS = {
  first_session: { type: "first_session", name: "First Step", icon: "🌱" },
  streak_7: { type: "streak_7", name: "7-Day Warrior", icon: "🔥" },
  streak_30: { type: "streak_30", name: "30-Day Champion", icon: "💎" },
  sessions_10: { type: "sessions_10", name: "10 Sessions Club", icon: "💪" },
  target_hit: { type: "target_hit", name: "Goal Crusher", icon: "🎯" }
};

const DAY_MS = 864e5;

const processCheckIn = async (userId, customDate = new Date(), hitTargetGoal = false) => {
  let g = await Gamification.findOne({ user: userId });
  if (!g) {
    g = new Gamification({ user: userId });
  }

  const now = new Date(customDate);
  now.setHours(0, 0, 0, 0);

  let lastDate = null;
  if (g.lastCheckInDate) {
    lastDate = new Date(g.lastCheckInDate);
    lastDate.setHours(0, 0, 0, 0);
  }

  // Already checked in today
  if (lastDate && lastDate.getTime() === now.getTime()) {
    return { gamification: g, newBadges: [] };
  }

  // Streak logic
  if (lastDate && now.getTime() - lastDate.getTime() <= DAY_MS + 3600000) { 
    // Consecutive day (+1 hour buffer for DST differences)
    g.currentStreak += 1;
  } else {
    // Streak broken or first time
    g.currentStreak = 1;
  }

  if (g.currentStreak > g.longestStreak) {
    g.longestStreak = g.currentStreak;
  }

  g.totalSessions += 1;
  g.lastCheckInDate = customDate;

  // Badge Checks
  const earnedTypes = new Set(g.badges.map(b => b.type));
  const newBadges = [];

  const addBadge = (defKey) => {
    const b = BADGE_DEFS[defKey];
    if (b && !earnedTypes.has(b.type)) {
      g.badges.push({ ...b, earnedAt: customDate });
      newBadges.push(b);
      earnedTypes.add(b.type);
    }
  };

  if (g.totalSessions === 1) addBadge("first_session");
  if (g.totalSessions >= 10) addBadge("sessions_10");
  if (g.currentStreak >= 7) addBadge("streak_7");
  if (g.currentStreak >= 30) addBadge("streak_30");
  if (hitTargetGoal) addBadge("target_hit");

  await g.save();

  return { gamification: g, newBadges };
};

module.exports = { processCheckIn, BADGE_DEFS };
