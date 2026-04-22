import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function FoodSymptomCorrelation() {
  const { apiFetch, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    apiFetch(`/api/correlation/${user._id}`)
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [apiFetch, user?._id]);

  if (loading) {
    return (
      <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 160 }}>
        <div style={{ color: "var(--sage)", fontSize: "0.9rem", fontWeight: 600 }}>Analyzing logs...</div>
      </div>
    );
  }

  const hasData = data && (data.triggers?.length > 0 || data.protective?.length > 0);

  if (error || !hasData) {
    return (
      <div className="card">
        <div className="card-title">Food & Symptom Patterns</div>
        <div style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5, marginTop: 10 }}>
          Keep logging your meals and symptoms for 2 weeks to see your personal patterns and triggers!
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">Food & Symptom Patterns</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
        
        {data.triggers?.length > 0 && (
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#d9534f", marginBottom: 8 }}>⚠️ Potential Triggers</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.triggers.map((item, idx) => (
                <div key={idx} style={{ 
                  background: "rgba(217, 83, 79, 0.1)", border: "1px solid rgba(217, 83, 79, 0.3)", 
                  padding: "8px 12px", borderRadius: "8px", fontSize: "0.8rem", color: "#a94442"
                }}>
                  <strong>{item.food}</strong> · {item.percentage}% of days with {item.symptom}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.protective?.length > 0 && (
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>✅ Protective Foods</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.protective.map((item, idx) => (
                <div key={idx} style={{ 
                  background: "rgba(124, 154, 126, 0.15)", border: "1px solid rgba(124, 154, 126, 0.3)", 
                  padding: "8px 12px", borderRadius: "8px", fontSize: "0.8rem", color: "var(--green)"
                }}>
                  <strong>{item.food}</strong> · {item.percentage}% chance of symptom-free day
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 8 }}>
          * Based on your last 30 days of combined PCOD and Nutrition logs. Not medical advice.
        </div>
      </div>
    </div>
  );
}
