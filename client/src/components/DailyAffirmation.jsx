import React, { useState, useEffect } from 'react';

const affirmationsData = {
  menstrual: [
    "Rest is not laziness — your body is doing powerful work 🌸",
    "I honor my body's need to slow down and heal 💜",
    "My cycle is a sign of strength, not weakness",
    "I am gentle with myself today and every day"
  ],
  follicular: [
    "I am full of energy and ready to bloom 🌱",
    "New beginnings are possible every single day",
    "I trust my body and its natural rhythm 💚",
    "I am growing stronger with every cycle"
  ],
  ovulatory: [
    "I radiate confidence and warmth today 🌟",
    "I am at my most magnetic and powerful self",
    "My voice matters — I speak with clarity and love",
    "I am connected, creative, and full of light ✨"
  ],
  luteal: [
    "My feelings are valid and I honor them 🌙",
    "I release what no longer serves me",
    "I am worthy of rest and gentle care 💜",
    "This too shall pass — I am resilient"
  ]
};

const getPhase = (day) => {
  if (!day) return 'follicular';
  const d = Number(day);
  if (d >= 1 && d <= 5) return 'menstrual';
  if (d >= 6 && d <= 13) return 'follicular';
  if (d === 14) return 'ovulatory';
  return 'luteal';
};

const getPhaseColor = (phase) => {
  switch(phase) {
    case 'menstrual': return '#fce4ec';
    case 'ovulatory': return '#fff8e1';
    case 'luteal': return '#ede7f6';
    case 'follicular':
    default: return '#e8f5e9';
  }
};

export default function DailyAffirmation({ cycleDay }) {
  const phase = getPhase(cycleDay);
  const color = getPhaseColor(phase);
  
  const textArray = affirmationsData[phase];
  const activeAffirmation = textArray[new Date().getDate() % textArray.length];

  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wf_affirmations');
      if (stored) setSaved(JSON.parse(stored));
    } catch(e) {}
  }, []);

  const saveToLocal = (newSaved) => {
    setSaved(newSaved);
    localStorage.setItem('wf_affirmations', JSON.stringify(newSaved));
  };

  const onSave = () => {
    if (!saved.includes(activeAffirmation)) {
      saveToLocal([activeAffirmation, ...saved]);
    }
  };

  const onRemove = (text) => {
    saveToLocal(saved.filter(a => a !== text));
  };

  const onShare = () => {
    const shareText = `Today's affirmation 🌿\n\n"${activeAffirmation}"\n\n— WellnessFit`;
    try {
      navigator.clipboard.writeText(shareText);
      alert("Affirmation copied to clipboard!");
    } catch(e) {}
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 15 }}>
      <div className="card-title">Daily Affirmation</div>
      
      <div style={{
        background: color,
        borderRadius: "12px",
        padding: "20px",
        position: "relative",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div style={{ fontSize: "3rem", fontFamily: "Playfair Display, serif", lineHeight: 0.5, color: "var(--charcoal)", opacity: 0.2, marginBottom: 15 }}>
          &ldquo;
        </div>
        <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--charcoal)", lineHeight: 1.5, marginBottom: 15 }}>
          {activeAffirmation}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 15 }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: "rgba(255,255,255,0.6)", padding: "4px 8px", borderRadius: "20px", color: "var(--charcoal)" }}>
            {phase} Phase
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "long", day: "numeric" })}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onSave} style={{ background: "rgba(255,255,255,0.7)", border: "none", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--charcoal)", transition: "all 0.2s" }}>
            ❤️ Save
          </button>
          <button onClick={onShare} style={{ background: "rgba(255,255,255,0.7)", border: "none", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--charcoal)", transition: "all 0.2s" }}>
            📤 Share
          </button>
        </div>
      </div>

      {saved.length > 0 && (
        <div style={{ marginTop: 5 }}>
          <button 
            type="button" 
            onClick={() => setShowSaved(!showSaved)} 
            style={{ 
              background: "none", border: "none", width: "100%", textAlign: "left", 
              fontSize: "0.8rem", fontWeight: 600, color: "var(--sage)", cursor: "pointer",
              padding: "5px 0", display: "flex", justifyContent: "space-between"
            }}
          >
            <span>My Saved Affirmations ({saved.length})</span>
            <span>{showSaved ? "▲" : "▼"}</span>
          </button>
          
          {showSaved && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {saved.map((text, i) => (
                <div key={i} style={{ 
                  background: "var(--bg)", padding: "10px 12px", borderRadius: "8px",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10
                }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--charcoal)", lineHeight: 1.4 }}>{text}</div>
                  <button 
                    onClick={() => onRemove(text)}
                    style={{ background: "none", border: "none", fontSize: "1rem", color: "var(--muted)", cursor: "pointer", padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
