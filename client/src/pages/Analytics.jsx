import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import WellnessTimeline from "../components/WellnessTimeline";
import styles from "./Analytics.module.css";

function Sparkline({ points = [] }) {
  if (!points.length) return <div className={styles.emptyBox}>No chart data yet</div>;
  const W = 360;
  const H = 90;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(0.1, max - min);
  const plot = points.map((v, i) => {
    const x = (i / Math.max(1, points.length - 1)) * W;
    const y = H - ((v - min) / span) * H;
    return `${x},${y}`;
  });
  const polyline = plot.join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.spark}>
      <polyline points={polyline} fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Analytics({ onNavigate, onLogout }) {
  const { apiFetch, user } = useAuth();
  const isTrainer = user?.role === "trainer";
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weight, setWeight] = useState({ logs: [], stats: {} });
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [pcodData, setPcodData] = useState({ logs: [], cycleInfo: null, insights: [] });
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    if (isTrainer || isAdmin) {
      setLoading(false);
      setError("");
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      const failSafe = window.setTimeout(() => {
        if (!mounted) return;
        setLoading(false);
        setError("Analytics request timed out. Please refresh.");
      }, 12000);

      try {
        const result = await apiFetch("/api/analytics/summary", { timeoutMs: 12000 });
        if (!mounted) return;

        const analytics = result?.analytics || {};
        setWeight(analytics.weight || { logs: [], stats: {} });
        setNutritionLogs(analytics.nutrition?.logs || []);
        setPcodData({
          logs: analytics.pcod?.logs || [],
          cycleInfo: analytics.pcod?.cycleInfo || null,
          insights: analytics.pcod?.insights || [],
        });

        if (result?.source === "cache") {
          setError(result?.message || "Showing cached analytics.");
        } else {
          setError("");
        }
      } catch (err) {
        if (mounted) {
          setWeight({ logs: [], stats: {} });
          setNutritionLogs([]);
          setPcodData({ logs: [], cycleInfo: null, insights: [] });
          setError(err?.message || "Unable to load analytics");
        }
      } finally {
        window.clearTimeout(failSafe);
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [apiFetch, isAdmin, isTrainer]);

  const weightPoints = useMemo(
    () => [...(weight.logs || [])].reverse().map((l) => l.weight).filter((v) => typeof v === "number"),
    [weight.logs]
  );

  const nutritionSummary = useMemo(() => {
    if (!nutritionLogs.length) return { avgCalories: 0, avgWater: 0, trackedDays: 0 };
    const totals = nutritionLogs.reduce(
      (acc, log) => {
        acc.calories += log?.totals?.calories || 0;
        acc.water += log?.waterLitres || 0;
        return acc;
      },
      { calories: 0, water: 0 }
    );
    return {
      avgCalories: Math.round(totals.calories / nutritionLogs.length),
      avgWater: Number((totals.water / nutritionLogs.length).toFixed(2)),
      trackedDays: nutritionLogs.length,
    };
  }, [nutritionLogs]);

  const symptomSummary = useMemo(() => {
    const count = {};
    (pcodData.logs || []).forEach((log) => {
      (log.symptoms || []).forEach((s) => {
        if (!s?.name) return;
        count[s.name] = (count[s.name] || 0) + 1;
      });
    });
    const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3);
  }, [pcodData.logs]);

  return (
    <div className={styles.layout}>
      <Sidebar active="analytics" onNavigate={onNavigate} onLogout={onLogout} />
      <main className={styles.main}>
        <div className="page-header">
          <div>
            <h1>{isAdmin ? "Platform Analytics" : isTrainer ? "Client Reports" : "Analytics"}</h1>
            <p>
              {isAdmin
                ? "Operational visibility across users, plans, and engagement"
                : isTrainer
                  ? "Trainer-facing client performance overview"
                  : "Progress insights from your real logs"}
            </p>
          </div>
        </div>

        {isTrainer ? (
          <>
            <div className="grid-4">
              {[
                ["Active Clients", "18", "4 need follow-up today"],
                ["Avg Plan Completion", "81%", "Across assigned programs"],
                ["Weight Check-ins", "29", "Received this week"],
                ["Pending Messages", "7", "Unread client notes"],
              ].map(([title, value, note]) => (
                <div className="card" key={title}>
                  <div className="card-title">{title}</div>
                  <div className={styles.big}>{value}</div>
                  <p className={styles.muted}>{note}</p>
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-title">Weekly Client Progress</div>
                <div className={styles.stack}>
                  {[
                    ["Weight-loss plan adherence", "84%"],
                    ["PCOD routine completion", "78%"],
                    ["Meal logging consistency", "69%"],
                    ["Workout attendance", "88%"],
                  ].map(([label, value]) => (
                    <div className={styles.row} key={label}>
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Follow-up Priorities</div>
                <div className={styles.stack}>
                  {[
                    "3 clients have not logged weight in 5+ days",
                    "2 PCOD clients reported fatigue spikes",
                    "4 program renewals are due this week",
                  ].map((item) => (
                    <div key={item} className={styles.tip}>
                      <div className={styles.tipText}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {isAdmin ? (
          <>
            <div className="grid-4">
              {[
                ["Registered Users", "1,284", "Across all roles"],
                ["Active Plans", "862", "Workout and nutrition plans"],
                ["DAU / WAU", "43%", "Engagement trend"],
                ["Pending Trainer Approvals", "5", "Need review"],
              ].map(([title, value, note]) => (
                <div className="card" key={title}>
                  <div className="card-title">{title}</div>
                  <div className={styles.big}>{value}</div>
                  <p className={styles.muted}>{note}</p>
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-title">Platform Health</div>
                <div className={styles.stack}>
                  {[
                    ["Reminder delivery", "97%"],
                    ["Premium conversion", "18%"],
                    ["Weekly retention", "71%"],
                    ["Content completion", "64%"],
                  ].map(([label, value]) => (
                    <div className={styles.row} key={label}>
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Operational Notes</div>
                <div className={styles.stack}>
                  {[
                    "Trainer onboarding queue needs review",
                    "PCOD article library has 3 draft updates",
                    "Premium plan upsell screen is underperforming this week",
                  ].map((item) => (
                    <div key={item} className={styles.tip}>
                      <div className={styles.tipText}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {loading ? <div className="card">Loading analytics...</div> : null}
        {error ? <div className="card">{error}</div> : null}

        {!loading && !isTrainer && !isAdmin ? (
          <>
            <div className={styles.tabs}>
              <button 
                onClick={() => setActiveTab("Overview")} 
                className={activeTab === "Overview" ? styles.activeTab : styles.tab}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab("Timeline")} 
                className={activeTab === "Timeline" ? styles.activeTab : styles.tab}
              >
                Timeline
              </button>
            </div>
            
            {activeTab === "Overview" && (
              <>
                <div className="grid-4">
              <div className="card">
                <div className="card-title">Current Weight</div>
                <div className={styles.big}>{weight.stats.latest ?? "--"} kg</div>
                <p className={styles.muted}>Logs count: {weight.stats.count || 0}</p>
              </div>
              <div className="card">
                <div className="card-title">Weight Change</div>
                <div className={styles.big}>{typeof weight.stats.change === "number" ? `${weight.stats.change} kg` : "--"}</div>
                <p className={styles.muted}>Compared to oldest in period</p>
              </div>
              <div className="card">
                <div className="card-title">Avg Calories (14d)</div>
                <div className={styles.big}>{nutritionSummary.avgCalories || "--"} kcal</div>
                <p className={styles.muted}>Tracked days: {nutritionSummary.trackedDays}</p>
              </div>
              <div className="card">
                <div className="card-title">Avg Water (14d)</div>
                <div className={styles.big}>{nutritionSummary.avgWater || "--"} L</div>
                <p className={styles.muted}>Hydration consistency</p>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-title">Weight Trend (3M)</div>
                <Sparkline points={weightPoints} />
              </div>

              <div className="card">
                <div className="card-title">PCOD Cycle Snapshot</div>
                {pcodData.cycleInfo ? (
                  <div className={styles.stack}>
                    <div>Cycle Day: <strong>{pcodData.cycleInfo.cycleDay}</strong></div>
                    <div>Phase: <strong>{pcodData.cycleInfo.phase}</strong></div>
                    <div>Average Cycle: <strong>{pcodData.cycleInfo.avgCycle} days</strong></div>
                  </div>
                ) : (
                  <p className={styles.muted}>No cycle data yet</p>
                )}
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-title">Top Symptoms</div>
                {symptomSummary.length ? (
                  <div className={styles.stack}>
                    {symptomSummary.map(([name, c]) => (
                      <div key={name} className={styles.row}>
                        <span>{name}</span>
                        <span>{c} logs</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>No symptom logs yet</p>
                )}
              </div>

              <div className="card">
                <div className="card-title">PCOD Insights</div>
                {pcodData.insights.length ? (
                  <div className={styles.stack}>
                    {pcodData.insights.map((item, i) => (
                      <div key={`${item.title}-${i}`} className={styles.tip}>
                        <div className={styles.tipTitle}>{item.title}</div>
                        <div className={styles.tipText}>{item.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>No insights available yet</p>
                )}
              </div>
            </div>
              </>
            )}

            {activeTab === "Timeline" && (
              <WellnessTimeline />
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
