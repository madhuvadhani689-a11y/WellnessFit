import { useMemo } from 'react';

const TIPS = [
  "💧 Drinking 2–3L water daily helps flush excess hormones",
  "🌿 Spearmint tea twice daily may help reduce testosterone",
  "🏃 Even 30 min walking 5x/week improves insulin resistance",
  "😴 Poor sleep worsens PCOD symptoms — aim for 7–8 hours",
  "🥗 Low GI foods like brown rice and oats help balance hormones",
  "☀️ Vitamin D deficiency is common in PCOD — get some sunlight",
  "🧘 Stress raises cortisol which worsens PCOD — try deep breathing",
  "🚫 Dairy and sugar can worsen inflammation in some PCOD women",
  "💊 Inositol (B8) supplements may help with insulin resistance",
  "🌸 Tracking your cycle helps predict and manage symptoms better",
  "🫚 Omega-3 rich foods like walnuts and flaxseeds reduce inflammation",
  "🍵 Green tea antioxidants help with hormonal balance"
];

const getPhaseData = (cycleDay) => {
  const day = parseInt(cycleDay, 10) || 1;
  if (day >= 1 && day <= 5) return {
    phase: "Menstrual",
    emoji: "🔴",
    bg: "#fce4ec",
    focus: "Rest and restore — your body is working hard",
    eat: "Iron-rich foods: spinach, dates, sesame seeds",
    move: "Gentle yoga or rest — avoid intense workouts",
    feel: "Be kind to yourself — low energy is normal"
  };
  if (day >= 6 && day <= 13) return {
    phase: "Follicular",
    emoji: "🌱",
    bg: "#e8f5e9",
    focus: "Energy rising — great time to start new things",
    eat: "Protein + fermented foods: sprouts, curd, eggs",
    move: "Cardio and strength training — energy is high",
    feel: "You may feel more confident and social today"
  };
  if (day === 14) return {
    phase: "Ovulatory",
    emoji: "🌟",
    bg: "#fff8e1",
    focus: "Peak energy — make the most of today",
    eat: "Anti-inflammatory foods: turmeric, flaxseeds, greens",
    move: "High intensity workouts work great now",
    feel: "Most sociable and confident phase of your cycle"
  };
  return {
    phase: "Luteal",
    emoji: "🌙",
    bg: "#ede7f6",
    focus: "Slow down and prepare — PMS may begin",
    eat: "Magnesium foods: banana, dark chocolate, pumpkin seeds",
    move: "Light walks, stretching, avoid overexertion",
    feel: "Mood dips are hormonal — journal your feelings"
  };
};

export default function WellnessInsights({ cycleDay }) {
  const phaseData = getPhaseData(cycleDay);
  
  const dailyTip = useMemo(() => {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }, []);

  return (
    <div className="card">
      <div className="card-title">Wellness Insights ✨</div>
      
      <div style={{
        background: phaseData.bg,
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "16px"
      }}>
        <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--charcoal)", marginBottom: "4px" }}>
          {phaseData.emoji} {phaseData.phase} Phase
        </div>
        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#555", marginBottom: "16px", fontStyle: "italic" }}>
          Today's Focus: {phaseData.focus}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", marginBottom: "4px" }}>🥗 Eat</div>
            <div style={{ fontSize: "0.75rem", color: "#444", lineHeight: "1.4" }}>{phaseData.eat}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", marginBottom: "4px" }}>🏃 Move</div>
            <div style={{ fontSize: "0.75rem", color: "#444", lineHeight: "1.4" }}>{phaseData.move}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", marginBottom: "4px" }}>💆 Feel</div>
            <div style={{ fontSize: "0.75rem", color: "#444", lineHeight: "1.4" }}>{phaseData.feel}</div>
          </div>
        </div>
      </div>

      <div style={{
        background: "#fef9e7",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start"
      }}>
        <div style={{ fontSize: "1.4rem" }}>💡</div>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", marginBottom: "4px" }}>
            Did you know?
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--charcoal)", lineHeight: "1.5" }}>
            {dailyTip}
          </div>
        </div>
      </div>
    </div>
  );
}
