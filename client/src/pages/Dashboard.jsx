import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import WellnessScore from "../components/WellnessScore";
import DailyAffirmation from "../components/DailyAffirmation";
import styles from "./Dashboard.module.css";

const GREET = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const FALLBACK_NUTRITION_LOG = {
  calorieGoal: 1800,
  totals: { calories: 0, protein: 0 },
  waterLitres: 0,
  meals: {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
  },
};

const FALLBACK_WORKOUTS = [
  "No workout scheduled",
  "No workout scheduled",
  "No workout scheduled",
  "No workout scheduled",
];

function WeightSVG({ data }) {
  const W = 480;
  const H = 150;
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const range = Math.max(max - min, 0.1);
  const pts = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - ((v - min) / range) * H,
  }));
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,${H} ${poly} ${W},${H}`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 150 }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C9A7E" stopOpacity=".3" />
          <stop offset="100%" stopColor="#7C9A7E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={0} y1={H * f} x2={W} y2={H * f} stroke="rgba(0,0,0,.05)" strokeWidth="1" />
      ))}
      <polygon points={area} fill="url(#wg)" />
      <polyline points={poly} fill="none" stroke="#7C9A7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="5" fill="#2D4A2F" />
    </svg>
  );
}

function RingsSVG() {
  const rings = [
    { r: 64, pct: 84, color: "#7C9A7E" },
    { r: 50, pct: 70, color: "#E8B4A0" },
    { r: 36, pct: 91, color: "#C9A84C" },
  ];
  return (
    <svg viewBox="0 0 160 160" style={{ width: 160, height: 160 }}>
      {rings.map(({ r, pct, color }) => {
        const circ = 2 * Math.PI * r;
        return (
          <g key={r}>
            <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="7" strokeOpacity=".12" />
            <circle
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          </g>
        );
      })}
      <text x="80" y="75" textAnchor="middle" fontSize="20" fontWeight="700" fill="#2D4A2F" fontFamily="Playfair Display,serif">84%</text>
      <text x="80" y="90" textAnchor="middle" fontSize="10" fill="#6B6B6B">Overall</text>
    </svg>
  );
}

const formatWeightTrend = (change) => {
  if (!Number.isFinite(change)) return "Track a few logs to see movement";
  if (change < 0) return `↓ ${Math.abs(change).toFixed(1)} kg this period`;
  if (change > 0) return `↑ ${change.toFixed(1)} kg this period`;
  return "No change this period";
};

const buildMeals = (log) => [
  ["Breakfast", log?.meals?.breakfast?.[0]?.name || "Nothing logged", log?.meals?.breakfast?.[0]?.calories || 0],
  ["Lunch", log?.meals?.lunch?.[0]?.name || "Nothing logged", log?.meals?.lunch?.[0]?.calories || 0],
  ["Snack", log?.meals?.snack?.[0]?.name || "Nothing logged", log?.meals?.snack?.[0]?.calories || 0],
];

export default function Dashboard({ onNavigate, onLogout }) {
  const { user, apiFetch } = useAuth();
  const [period, setPeriod] = useState("1M");
  const [checkedWorkouts, setCheckedWorkouts] = useState(new Set());
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightStats, setWeightStats] = useState({});
  const [nutritionLog, setNutritionLog] = useState(FALLBACK_NUTRITION_LOG);
  const [cycleInfo, setCycleInfo] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const [weightRes, nutritionRes, pcodRes, workoutRes, statsRes] = await Promise.all([
          apiFetch(`/api/weight?period=${period}`),
          apiFetch("/api/nutrition/today"),
          apiFetch("/api/pcod"),
          apiFetch("/api/workout/schedule?days=7"),
          apiFetch("/api/checkins/stats"),
        ]);

        if (!mounted) return;
        setWeightLogs(weightRes.logs || []);
        setWeightStats(weightRes.stats || {});
        setNutritionLog(nutritionRes.log || FALLBACK_NUTRITION_LOG);
        setCycleInfo(pcodRes.cycleInfo || null);
        setWorkoutPlan((workoutRes.plans || [])[0] || null);
        setGamification(statsRes?.gamification || null);
      } catch (_err) {
        if (!mounted) return;
        setWeightLogs([]);
        setWeightStats({});
        setNutritionLog(FALLBACK_NUTRITION_LOG);
        setCycleInfo(null);
        setWorkoutPlan(null);
        setGamification(null);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [apiFetch, period]);

  const toggleWorkout = (i) => {
    const next = new Set(checkedWorkouts);
    next.has(i) ? next.delete(i) : next.add(i);
    setCheckedWorkouts(next);
  };

  const chartData = useMemo(
    () => (weightLogs.length ? [...weightLogs].reverse().map((log) => log.weight) : []),
    [weightLogs]
  );
  const latestWeight = weightStats.latest ?? chartData[chartData.length - 1] ?? 0;
  const calorieGoal = nutritionLog?.calorieGoal ?? user?.preferences?.goals?.calorieGoal ?? 1800;
  const caloriesToday = nutritionLog?.totals?.calories ?? 0;
  const proteinToday = nutritionLog?.totals?.protein ?? 0;
  const waterToday = nutritionLog?.waterLitres ?? 0;
  const meals = buildMeals(nutritionLog);
  const workoutItems = workoutPlan?.blocks?.slice(0, 4).map((block) => `${block.title} ${block.durationMin} min`) || FALLBACK_WORKOUTS;
  const showPCOD = !user?.gender || user?.gender === 'female' || user?.gender === 'prefer_not_to_say';

  return (
    <div className={styles.layout}>
      <Sidebar active="dashboard" onNavigate={onNavigate} onLogout={onLogout} />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.greeting}>{GREET()}, {user?.name?.split(" ")[0] || "there"} 🌿</h1>
            <p className={styles.greetSub}>Here&apos;s your wellness overview for today</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {gamification && gamification.currentStreak > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(232, 180, 160, 0.2)", color: "#c84e27", padding: "8px 14px", borderRadius: "20px", fontWeight: "bold", fontSize: "0.9rem" }}>
                <span>🔥</span> {gamification.currentStreak} Day Streak
              </div>
            )}
            <div className={styles.dateBadge}>📅 {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}</div>
          </div>
        </div>

        <div className={`grid-4 ${styles.statGrid}`}>
          {[
            { color: "var(--sage)", icon: "⚖️", val: `${latestWeight} kg`, lbl: "Current Weight", trend: formatWeightTrend(weightStats.change), up: (weightStats.change ?? 0) <= 0 },
            { color: "var(--blush)", icon: "🔥", val: `${caloriesToday} kcal`, lbl: "Calories Today", trend: `${Math.max(0, calorieGoal - caloriesToday)} under goal`, up: caloriesToday <= calorieGoal },
            { color: "var(--gold)", icon: "🌸", val: cycleInfo ? `Day ${cycleInfo.cycleDay}` : "No data", lbl: `Cycle Phase · ${cycleInfo?.phase || "Unknown"}`, trend: cycleInfo ? `${cycleInfo.avgCycle}-day average cycle` : "Log PCOD data for prediction", up: true },
            { color: "#5BA4CF", icon: "💧", val: `${waterToday.toFixed(1)} L`, lbl: "Water Intake", trend: `${Math.max(0, 2.5 - waterToday).toFixed(1)} L to go`, up: waterToday >= 2 },
          ].map(({ color, icon, val, lbl, trend, up }) => (
            <div key={lbl} className={`card ${styles.statCard}`} style={{ borderTop: `3px solid ${color}` }}>
              <div className={styles.statIcon}>{icon}</div>
              <div className={styles.statVal}>{val}</div>
              <div className={styles.statLbl}>{lbl}</div>
              <div className={styles.statTrend} style={{ color: up ? "var(--sage)" : "var(--muted)" }}>{trend}</div>
            </div>
          ))}
        </div>

        {gamification && gamification.badges && gamification.badges.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>🏆 Your Trophy Shelf</div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {gamification.badges.map(b => (
                <div key={b.type} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(124,154,126,0.1)", padding: "12px 16px", borderRadius: "12px", minWidth: "90px" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{b.icon}</div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "600", textAlign: "center", color: "var(--charcoal)" }}>{b.name}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "4px" }}>{new Date(b.earnedAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`grid-3 ${styles.chartRow}`} style={{ gridTemplateColumns: "1.6fr 1fr 1fr" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span className="card-title" style={{ marginBottom: 0 }}>Weight Progress</span>
              <div className={styles.periodTabs}>
                {["1W", "1M", "3M"].map((p) => (
                  <button key={p} className={`${styles.pTab} ${period === p ? styles.pActive : ""}`} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
            </div>
            {chartData.length ? <WeightSVG data={chartData} /> : <div style={{ color: "var(--muted)", fontSize: ".85rem" }}>No weight data yet for this user.</div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: ".73rem", color: "var(--muted)" }}>
              <span>{weightStats.oldest ? `Start · ${weightStats.oldest} kg` : "Start · 0 kg"}</span>
              <span style={{ color: "var(--sage)", fontWeight: 700 }}>{weightStats.latest ? `Today · ${weightStats.latest} kg` : "Today · 0 kg"}</span>
            </div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="card-title" style={{ textAlign: "center" }}>Today&apos;s Goals</div>
            <RingsSVG />
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              {[["#7C9A7E", "Calories", `${caloriesToday}/${calorieGoal}`], ["#E8B4A0", "Protein", `${proteinToday}/100g`], ["#C9A84C", "Water", `${waterToday.toFixed(1)}/2.5L`]].map(([c, l, v]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: c, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: ".8rem", color: "var(--muted)" }}>{l}</span>
                  <span style={{ fontSize: ".8rem", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <WellnessScore data={{
            calories: caloriesToday,
            calorieGoal: calorieGoal,
            water: waterToday,
            waterGoal: 2.5,
            moodLogged: false, // Not fetched natively in Dashboard
            workoutLogged: checkedWorkouts.size > 0,
            pcodLogged: !!cycleInfo
          }} />
        </div>

        <div className="grid-3">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="card-title">🥗 Today&apos;s Meals</div>
              {meals.map(([t, n, c]) => (
                <div key={t} className={styles.mealRow}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: ".86rem", fontWeight: 600 }}>{t}: {n}</div></div>
                  <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>{c} kcal</span>
                </div>
              ))}
              <button className="btn btn-dashed" onClick={() => onNavigate("nutrition")}>+ Log Dinner → View Plan</button>
            </div>
            <DailyAffirmation cycleDay={cycleInfo?.cycleDay} />
          </div>

          {showPCOD && (
            <div className="card">
              <div className="card-title">🌸 PCOD Today</div>
              <div className={styles.cycleMini}>
                <div className={styles.cycleBig}>{cycleInfo?.cycleDay || "--"}</div>
                <div className={styles.cycleSub}>{cycleInfo ? `${cycleInfo.phase} Phase · Day ${cycleInfo.cycleDay} of ${cycleInfo.avgCycle}` : "Add cycle data to unlock insights"}</div>
              </div>
              <div style={{ fontSize: ".76rem", color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>Today&apos;s Focus</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(cycleInfo ? [["Hydration", true], ["Rest", false], ["Movement", true], ["Nutrition", true]] : [["No logs yet", true]]).map(([s, a]) => (
                  <span key={s} style={{ padding: "4px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 600, background: a ? "var(--blush)" : "rgba(124,154,126,.1)", color: a ? "var(--charcoal)" : "var(--sage)" }}>{s}</span>
                ))}
              </div>
              <button className="btn btn-primary btn-full" style={{ marginTop: 14, borderRadius: "var(--radius-sm)" }} onClick={() => onNavigate("pcod")}>Open PCOD Tracker →</button>
            </div>
          )}

          <div className="card">
            <div className="card-title">💪 Today&apos;s Workout</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {workoutItems.map((item, i) => (
                <div key={`${item}-${i}`} className={styles.workoutRow} onClick={() => toggleWorkout(i)}>
                  <span style={{ fontSize: ".86rem", flex: 1 }}>{item}</span>
                  <div className={styles.check} style={{ background: checkedWorkouts.has(i) ? "var(--sage)" : "rgba(124,154,126,.15)", color: checkedWorkouts.has(i) ? "#fff" : "var(--sage)" }}>{checkedWorkouts.has(i) ? "✓" : "○"}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-sage btn-full" style={{ marginTop: 14, borderRadius: "var(--radius-sm)" }} onClick={() => onNavigate("workout")}>Open Workout Planner</button>
          </div>
        </div>
      </main>
    </div>
  );
}
