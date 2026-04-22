import React from 'react';

const calculateScore = (data) => {
  let score = 0;
  try {
    if (data?.calories > 0)
      score += Math.min(25, (data.calories / (data.calorieGoal || 1800)) * 25);
    if (data?.water > 0)
      score += Math.min(20, (data.water / (data.waterGoal || 2.5)) * 20);
    if (data?.moodLogged) score += 20;
    if (data?.workoutLogged) score += 20;
    if (data?.pcodLogged) score += 15;
  } catch(e) { return 0; }
  return Math.round(score);
};

export default function WellnessScore({ data }) {
  const score = calculateScore(data);
  
  let color = "#3d5a3e";
  if (score <= 40) color = "#d9534f";
  else if (score <= 70) color = "#f0ad4e";

  let msg = "Small steps count — you've got this! 💪";
  if (score >= 90) msg = "Perfect wellness day! 🌟";
  else if (score >= 70) msg = "Great job today! 💚";
  else if (score >= 50) msg = "Good progress — keep going! 🌿";

  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = Math.max(0, circumference - (score / 100) * circumference);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div className="card-title" style={{ width: "100%", textAlign: "center" }}>Today&apos;s Score</div>
      
      <div style={{ position: "relative", width: 140, height: 140, marginBottom: 15, marginTop: 10 }}>
        <svg height="140" width="140">
          <circle stroke="#f0f0f0" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx="70" cy="70" />
          <circle 
            stroke={color} 
            strokeWidth={stroke} 
            strokeDasharray={circumference + ' ' + circumference} 
            style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out", transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} 
            strokeLinecap="round" 
            fill="transparent" 
            r={normalizedRadius} 
            cx="70" 
            cy="70" 
          />
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--charcoal)", lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>/ 100</span>
        </div>
      </div>

      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: color, marginBottom: 20, textAlign: "center" }}>
        {msg}
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: "🥗", label: "Nutrition", on: data?.calories > 0, bg: "var(--blush)" },
          { icon: "💧", label: "Water", on: data?.water > 0, bg: "#5BA4CF" },
          { icon: "😊", label: "Mood", on: data?.moodLogged, bg: "var(--gold)" },
          { icon: "🏃", label: "Activity", on: data?.workoutLogged, bg: "var(--sage)" },
          { icon: "🌸", label: "Cycle", on: data?.pcodLogged, bg: "var(--charcoal)" },
        ].map((f) => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.1rem" }}>{f.icon}</span>
            <span style={{ fontSize: "0.78rem", flex: 1, color: "var(--muted)", fontWeight: 600 }}>{f.label}</span>
            <div style={{ width: 60, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", background: f.on ? f.bg : "transparent", width: f.on ? "100%" : "0%", transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
