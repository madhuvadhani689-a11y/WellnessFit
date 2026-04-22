import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AIInsightsPanel() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch("/api/pcod/ai-insights", { method: "POST" })
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiFetch]);

  if (loading || !data) {
    return (
      <div className="card">
        <div className="card-title">AI Insights ✨</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ 
              height: 48, background: "rgba(124, 154, 126, 0.1)", 
              borderRadius: "8px", animation: "pulse 1.5s infinite"
            }} />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    { icon: "🔮", title: "Prediction", text: data.prediction },
    { icon: "📊", title: "Your Pattern", text: data.topPattern },
    { icon: "🥗", title: "Food Tip", text: data.foodTip },
    { icon: "🏃", title: "Move Tip", text: data.exerciseTip },
    { icon: "💚", title: "Encouragement", text: data.encouragement },
  ];

  return (
    <div className="card">
      <div className="card-title">AI Insights ✨</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, idx) => (
          item.text ? (
            <div key={idx} style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: ".84rem", fontWeight: 700, color: "var(--green)", marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.55 }}>{item.text}</div>
              </div>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}
