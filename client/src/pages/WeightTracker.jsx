import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import styles from "./WeightTracker.module.css";

const getBmiCategory = (b) => b < 18.5 ? "Underweight" : b < 25 ? "Normal" : b < 30 ? "Overweight" : "Obese";
const IDEAL_BMI = 22;

const calculateWeightMetrics = ({ weightKg, height }) => {
  const numericWeight = Number(weightKg);
  const numericHeight = Number(height);

  if (!Number.isFinite(numericWeight) || numericWeight <= 0 || !Number.isFinite(numericHeight) || numericHeight <= 0) {
    throw new Error("Please provide valid weight and height values.");
  }

  const heightMeters = numericHeight > 3 ? numericHeight / 100 : numericHeight;
  const bmi = Number((numericWeight / (heightMeters * heightMeters)).toFixed(2));
  const idealWeight = Number((IDEAL_BMI * heightMeters * heightMeters).toFixed(2));
  const goalDifference = Number((numericWeight - idealWeight).toFixed(2));

  return {
    bmi,
    idealWeight,
    goalDifference,
    category: getBmiCategory(bmi),
  };
};

function WeightSVG({ data }) {
  const vals = [...data].reverse().map((l) => l.weight);
  if (!vals.length) return null;
  const W = 500;
  const H = 160;
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const pts = vals.map((v, i) => ({
    x: 20 + (i / Math.max(vals.length - 1, 1)) * (W - 40),
    y: H - 20 - ((v - min) / (max - min || 1)) * (H - 40),
  }));
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `20,${H - 20} ${poly} ${pts[pts.length - 1].x},${H - 20}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160 }}>
      <defs>
        <linearGradient id="wgd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C9A7E" stopOpacity=".3" />
          <stop offset="100%" stopColor="#7C9A7E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={20} y1={H * f} x2={W - 20} y2={H * f} stroke="rgba(0,0,0,.05)" strokeWidth="1" />
      ))}
      <polygon points={area} fill="url(#wgd)" />
      <polyline points={poly} fill="none" stroke="#7C9A7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 6 : 3} fill={i === pts.length - 1 ? "#2D4A2F" : "#7C9A7E"} />
      ))}
    </svg>
  );
}

export default function WeightTracker({ onNavigate, onBack, onLogout }) {
  const { apiFetch, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState(() => String(user?.heightCm || ""));
  const [heightUnit, setHeightUnit] = useState("cm");
  const [notes, setNotes] = useState("");
  const [goal, setGoal] = useState(() => (user?.targetWeight ? String(user.targetWeight) : ""));
  const [period, setPeriod] = useState("1M");
  const [toast, setToast] = useState("");
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState("");
  const [bmiError, setBmiError] = useState("");
  const [idealWeight, setIdealWeight] = useState(null);
  const [goalDifference, setGoalDifference] = useState(null);
  const [goalAuto, setGoalAuto] = useState(true);
  const [progress, setProgress] = useState({
    currentWeight: 0,
    startWeight: 0,
    targetWeight: 0,
    direction: "maintain",
    progressPercent: 0,
    changeSinceStartKg: 0,
    remainingKg: 0,
    daysTracked: 0,
    loggedDays: 0,
  });

  useEffect(() => {
    setGoal(user?.targetWeight ? String(user.targetWeight) : "");
    setGoalAuto(!(user?.targetWeight > 0));
  }, [user?.targetWeight]);

  useEffect(() => {
    setHeight(String(user?.heightCm || ""));
    setHeightUnit("cm");
  }, [user?.heightCm]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [logsData, progressData] = await Promise.all([
          apiFetch(`/api/weight?period=${period}`),
          apiFetch("/api/weight/progress"),
        ]);

        if (!active) return;
        setLogs(logsData.logs || []);
        setProgress((current) => ({ ...current, ...(progressData.progress || {}) }));

        if (import.meta.env.DEV) {
          console.log("[WeightTracker] weight logs response", logsData);
          console.log("[WeightTracker] progress response", progressData);
        }
      } catch (err) {
        if (!active) return;
        setLogs([]);
        if (import.meta.env.DEV) {
          console.log("[WeightTracker] load failed", err);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [apiFetch, period, user?._id]);

  useEffect(() => {
    if (weight) {
      try {
        const normalizedHeight = heightUnit === "cm" ? height : Number(height) * 100;
        const metrics = calculateWeightMetrics({ weightKg: weight, height: normalizedHeight });
        setBmi(metrics.bmi.toFixed(2));
        setBmiCategory(metrics.category);
        setIdealWeight(metrics.idealWeight.toFixed(2));
        setGoalDifference(metrics.goalDifference.toFixed(2));
        setBmiError("");
        if (goalAuto) {
          setGoal(String(metrics.idealWeight.toFixed(2)));
        }
      } catch {
        setBmi(null);
        setBmiCategory("");
        setIdealWeight(null);
        setGoalDifference(null);
        setBmiError("Please enter valid weight and height.");
      }
    } else {
      setBmi(null);
      setBmiCategory("");
      setIdealWeight(null);
      setGoalDifference(null);
      setBmiError("");
    }
  }, [goalAuto, height, heightUnit, weight]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const reloadWeightData = async () => {
    const [logsData, progressData] = await Promise.all([
      apiFetch(`/api/weight?period=${period}`),
      apiFetch("/api/weight/progress"),
    ]);
    setLogs(logsData.logs || []);
    setProgress((current) => ({ ...current, ...(progressData.progress || {}) }));
    return { logsData, progressData };
  };

  const handleLog = async () => {
    if (!weight) return;
    try {
      await apiFetch("/api/weight", {
        method: "POST",
        body: JSON.stringify({ weight: parseFloat(weight), notes }),
      });

      const updated = await reloadWeightData();
      setWeight("");
      setNotes("");
      showToast("Weight logged.");

      if (import.meta.env.DEV) {
        console.log("[WeightTracker] state updated after save", {
          logs: updated.logsData.logs || [],
          progress: updated.progressData.progress || {},
        });
      }
    } catch {
      showToast("Unable to save weight. Check the backend connection.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/weight/${id}`, { method: "DELETE" });
      const updated = await reloadWeightData();
      showToast("Log deleted.");

      if (import.meta.env.DEV) {
        console.log("[WeightTracker] state updated after delete", {
          logs: updated.logsData.logs || [],
          progress: updated.progressData.progress || {},
        });
      }
    } catch {
      showToast("Unable to delete log right now.");
    }
  };

  const latest = Number(progress.currentWeight ?? logs[0]?.weight ?? 0);
  const oldest = Number(progress.startWeight ?? logs[logs.length - 1]?.weight ?? Number(user?.startingWeight || 0));
  const direction = progress.direction || "maintain";
  const isGainGoal = direction === "gain";
  const goalValue = Number.isFinite(parseFloat(goal))
    ? parseFloat(goal)
    : Number(progress.targetWeight ?? user?.targetWeight ?? 0);
  const change = Number(progress.changeSinceStartKg ?? (latest - oldest)).toFixed(1);
  const goalPct = Number(progress.progressPercent ?? 0);
  const remainingToGoal = Number(
    progress.remainingKg ??
      (isGainGoal ? Math.max(0, goalValue - latest) : Math.max(0, latest - goalValue))
  ).toFixed(1);
  const daysTracked = Number(progress.daysTracked ?? 0);
  const loggedDays = Number(progress.loggedDays ?? logs.length ?? 0);
  const changeMagnitude = Math.abs(Number(change)).toFixed(1);
  const changeLabel = isGainGoal ? "Gained" : "Lost";

  return (
    <div className={styles.layout}>
      <Sidebar active="weight" onNavigate={onNavigate} onLogout={onLogout} />

      <main className={styles.main}>
        <div className="page-header">
          <button className="back-btn" onClick={onBack}>Back to Dashboard</button>
          <div>
            <h1>Weight Tracker</h1>
            <p>Monitor your weight journey with detailed analytics</p>
          </div>
        </div>

        <div className={`grid-4 ${styles.statRow}`}>
          {[["Current", `${latest} kg`, logs.length ? "Latest logged value" : "No data yet"], ["Starting", `${oldest} kg`, logs.length ? "Initial weight" : "Starts empty for new users"], ["Total Change", `${change} kg`, "All time"], ["Goal", `${goalValue || 0} kg`, "Target weight"]].map(([l, v, s]) => (
            <div key={l} className="card">
              <div style={{ fontSize: ".76rem", color: "var(--muted)", fontWeight: 700, marginBottom: 6, letterSpacing: ".04em" }}>{l.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: "1.7rem", color: "var(--green)", fontWeight: 900 }}>{v}</div>
              <div style={{ fontSize: ".76rem", color: "var(--sage)", marginTop: 4, fontWeight: 600 }}>{s}</div>
            </div>
          ))}
        </div>

        <div className={styles.twoCol}>
          <div className="col">
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span className="card-title" style={{ marginBottom: 0 }}>Weight Over Time</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {["1W", "1M", "3M"].map((p) => (
                    <button key={p} className={`${styles.pTab} ${period === p ? styles.pActive : ""}`} onClick={() => setPeriod(p)}>{p}</button>
                  ))}
                </div>
              </div>
              {logs.length ? <WeightSVG data={logs} /> : <div style={{ color: "var(--muted)", fontSize: ".85rem" }}>No weight logs yet.</div>}
            </div>

            <div className="card">
              <div className="card-title">Log History</div>
              <div className={styles.histList}>
                {logs.length === 0 ? <div style={{ color: "var(--muted)", fontSize: ".82rem" }}>No entries yet for this user.</div> : null}
                {logs.slice(0, 10).map((l, i) => {
                  const prev = logs[i + 1]?.weight;
                  const diff = prev ? (l.weight - prev).toFixed(1) : null;
                  return (
                    <div key={l._id} className={styles.histItem}>
                      <span className={styles.histDate}>{new Date(l.loggedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <span className={styles.histWeight}>{l.weight} kg</span>
                      {diff && (
                        <span className={styles.histDiff} style={{ color: parseFloat(diff) < 0 ? "var(--sage)" : "#dc2626", background: parseFloat(diff) < 0 ? "rgba(124,154,126,.1)" : "rgba(220,60,60,.08)" }}>
                          {parseFloat(diff) < 0 ? "DOWN" : "UP"} {Math.abs(diff)} kg
                        </span>
                      )}
                      {l.notes && <span className={styles.histNote}>{l.notes}</span>}
                      <button className={styles.delBtn} onClick={() => handleDelete(l._id)} title="Delete">×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card">
              <div className="card-title">Log Today's Weight</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="form-label">Weight (kg) *</label>
                  <input className="form-input" type="number" step=".1" placeholder="e.g. 68.2" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
                  <div>
                    <label className="form-label">Height *</label>
                    <input className="form-input" type="number" step=".01" placeholder={heightUnit === "cm" ? "e.g. 165" : "e.g. 1.65"} value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Unit</label>
                    <select className="form-input" value={heightUnit} onChange={(e) => setHeightUnit(e.target.value)}>
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Goal Weight (kg)</label>
                  <input
                    className="form-input"
                    type="number"
                    step=".1"
                    placeholder="e.g. 62"
                    value={goal}
                    onChange={(e) => {
                      setGoal(e.target.value);
                      setGoalAuto(false);
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: ".74rem", color: "var(--muted)" }}>
                      {goalAuto
                        ? (height && weight ? "Goal weight is auto-suggested from BMI." : "Enter weight and height to auto-calculate goal weight.")
                        : "Manual goal weight enabled."}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: "4px 10px", fontSize: ".72rem" }}
                      onClick={() => setGoalAuto((current) => !current)}
                    >
                      {goalAuto ? "Use Manual" : "Use Auto"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Notes (optional)</label>
                  <input className="form-input" placeholder="e.g. Fasted, post workout" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                {bmi && (
                  <div style={{ background: "rgba(124,154,126,.08)", borderRadius: "var(--radius-sm)", padding: 14, textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: "1.9rem", color: "var(--green)", fontWeight: 900 }}>BMI {bmi}</div>
                    <div style={{ fontSize: ".8rem", color: "var(--sage)", fontWeight: 600, marginTop: 2 }}>{bmiCategory}</div>
                    <div style={{ marginTop: 10, fontSize: ".8rem", color: "var(--muted)" }}>Ideal Weight: {idealWeight} kg</div>
                    <div style={{ marginTop: 4, fontSize: ".8rem", color: "var(--muted)" }}>Goal Difference: {goalDifference} kg</div>
                  </div>
                )}
                {!bmi && bmiError ? (
                  <div style={{ background: "rgba(220,38,38,.08)", borderRadius: "var(--radius-sm)", padding: 12, color: "#b91c1c", fontSize: ".82rem", fontWeight: 600 }}>
                    {bmiError}
                  </div>
                ) : null}
                <button className="btn btn-primary btn-full" onClick={handleLog}>+ Log Weight</button>
              </div>
            </div>

            <div className="card" style={{ background: "var(--green)" }}>
              <div className="card-title" style={{ color: "#fff" }}>Goal Progress</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: ".8rem", marginBottom: 8 }}>{oldest} kg to {goalValue || 0} kg target</div>
              <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, height: 14, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", borderRadius: 10, background: "linear-gradient(90deg,var(--sage-light),var(--sage))", width: `${goalPct}%`, transition: "width 1s ease" }} />
              </div>
              <div style={{ color: "#fff", fontSize: ".84rem", textAlign: "right", marginBottom: 20 }}>{goalPct}% complete</div>
              <div className="grid-3" style={{ gap: 10 }}>
                {[[`${changeMagnitude} kg`, changeLabel], [`${daysTracked || loggedDays}`, "Days"], [`${remainingToGoal} kg`, "To Go"]].map(([v, l]) => (
                  <div key={l} style={{ textAlign: "center", background: "rgba(255,255,255,.07)", borderRadius: 10, padding: "12px 6px" }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: "1.2rem", color: "#fff", fontWeight: 900 }}>{v}</div>
                    <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.45)", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

