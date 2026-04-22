import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import TrainerChatPanel from "../components/TrainerChatPanel";
import styles from "./TrainerDashboard.module.css";

const CLIENT_PIPELINE = [
  { label: "New Assessments", value: 6, note: "Profiles waiting for first review" },
  { label: "Active Clients", value: 18, note: "Weekly coaching in progress" },
  { label: "Programs Due", value: 4, note: "Need workout refresh today" },
  { label: "Check-ins Pending", value: 7, note: "Unread client updates" },
];

const TODAY_SESSIONS = [
  { time: "06:30 AM", client: "Nivetha R", focus: "Mobility + core reset" },
  { time: "11:00 AM", client: "Asha K", focus: "PCOD-friendly cardio block" },
  { time: "05:45 PM", client: "Divya P", focus: "Strength progression review" },
];

const QUICK_ACTIONS = [
  { title: "Build Program", desc: "Create a new weekly workout block", target: "workout" },
  { title: "Review Schedule", desc: "Manage upcoming sessions and planning", target: "workout" },
  { title: "Trainer Settings", desc: "Update certifications and capacity", target: "settings" },
];

const AI_SUMMARY = [
  { title: "Missed Workouts", value: "3", note: "Clients skipped today's assigned session", tone: "warn" },
  { title: "Fast Movers", value: "2", note: "Clients are ready for intensity progression", tone: "good" },
  { title: "Drop-off Risk", value: "1", note: "Needs personal follow-up before tomorrow", tone: "risk" },
];

const CLIENT_SPOTLIGHTS = [
  {
    name: "Asha K",
    goal: "PCOD care",
    adherence: "82%",
    status: "Needs recovery check",
    note: "Reported low energy after the last cardio cycle.",
  },
  {
    name: "Nivetha R",
    goal: "Fat loss",
    adherence: "91%",
    status: "Ready for progression",
    note: "Completed all mobility blocks and is asking for harder sets.",
  },
  {
    name: "Divya P",
    goal: "Strength build",
    adherence: "74%",
    status: "Missed two logs",
    note: "Schedule a quick check-in before Friday to prevent drop-off.",
  },
];

const COACHING_ALERTS = [
  "3 clients have not submitted meal logs in the last 48 hours.",
  "2 reassessment forms are waiting for your review before evening sessions.",
  "One client is close to capacity limits on weekly cardio volume.",
  "Friday's strength cohort still needs a refreshed cooldown block.",
];

const WEEKLY_FOCUS = [
  { day: "Mon", theme: "Assessment reviews", load: "5 check-ins" },
  { day: "Tue", theme: "Program rewrites", load: "3 plans due" },
  { day: "Wed", theme: "PCOD coaching", load: "2 support calls" },
  { day: "Thu", theme: "Strength tracking", load: "4 progress reviews" },
  { day: "Fri", theme: "Retention follow-up", load: "6 renewal chats" },
];

const RESOURCE_LIBRARY = [
  { title: "Low-energy training swaps", meta: "For PCOD and recovery-heavy weeks" },
  { title: "Strength progression template", meta: "4-week block with load checkpoints" },
  { title: "Nutrition adherence prompts", meta: "Short follow-up scripts for WhatsApp" },
];

const CLIENT_HEATMAP = [
  { name: "Asha", status: "yellow" },
  { name: "Nivetha", status: "green" },
  { name: "Divya", status: "red" },
  { name: "Meera", status: "green" },
  { name: "Kavi", status: "yellow" },
  { name: "Ritu", status: "green" },
  { name: "Pooja", status: "red" },
  { name: "Sneha", status: "green" },
  { name: "Isha", status: "yellow" },
];

const ACTIVITY_FEED = [
  { time: "10 min ago", text: "Rahul completed Day 5 workout", type: "good" },
  { time: "24 min ago", text: "Anu skipped her mobility session", type: "warn" },
  { time: "48 min ago", text: "Vikram unlocked a 3-week consistency streak", type: "good" },
  { time: "1 hr ago", text: "Asha reported fatigue after cardio block", type: "risk" },
];

const CLIENT_SEGMENTS = [
  { name: "Weight Loss", count: 8, note: "Highest demand this week" },
  { name: "Muscle Gain", count: 5, note: "Strength plans due for 2 clients" },
  { name: "PCOD Care", count: 4, note: "Recovery-focused coaching active" },
];

const CALENDAR_LOAD = [
  { slot: "06:00 - 08:00", load: "Busy", note: "3 sessions back-to-back", level: "high" },
  { slot: "11:00 - 01:00", load: "Balanced", note: "Ideal review + coaching window", level: "medium" },
  { slot: "03:00 - 05:00", load: "Open", note: "Good slot for new assessment calls", level: "low" },
];

const FALLBACK_TRAINER_DATA = {
  metrics: {
    newAssessments: CLIENT_PIPELINE[0].value,
    activeClients: CLIENT_PIPELINE[1].value,
    programsDue: CLIENT_PIPELINE[2].value,
    checkinsPending: CLIENT_PIPELINE[3].value,
  },
  aiSummary: AI_SUMMARY,
  todaySessions: TODAY_SESSIONS,
  heatmap: CLIENT_HEATMAP,
  activityFeed: ACTIVITY_FEED,
  segments: CLIENT_SEGMENTS,
  spotlights: CLIENT_SPOTLIGHTS,
  alerts: COACHING_ALERTS,
  winsThisWeek: [],
};

const TRAINER_MODULES = [
  {
    title: "Client Management",
    points: ["View assigned users", "Check goals and core health data", "Review current coaching load"],
  },
  {
    title: "Workout Builder",
    points: ["Create custom workout plans", "Assign routines by goal", "Refresh weekly blocks quickly"],
  },
  {
    title: "Diet Plan Creator",
    points: ["Build meal guidance by gain/loss/PCOD", "Adjust calories and macro targets", "Reuse saved meal templates"],
  },
];

export default function TrainerDashboard({ onNavigate, onLogout }) {
  const { user, apiFetch } = useAuth();
  const [selectedClient, setSelectedClient] = useState(CLIENT_SPOTLIGHTS[0].name);
  const [dashboardData, setDashboardData] = useState(FALLBACK_TRAINER_DATA);
  const [syncStatus, setSyncStatus] = useState("Live");

  const trainerTitle = useMemo(() => {
    const specialization = user?.trainerProfile?.specialization?.trim();
    return specialization ? specialization : "Wellness Coach";
  }, [user]);

  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const loadDashboard = async () => {
      if (user?.role !== "trainer") return;

      try {
        const data = await apiFetch("/api/trainer/dashboard?clientLimit=120&lookbackDays=90", { timeoutMs: 12000 });
        if (!mounted) return;
        setDashboardData({
          metrics: data.metrics || FALLBACK_TRAINER_DATA.metrics,
          aiSummary: data.aiSummary?.length ? data.aiSummary : FALLBACK_TRAINER_DATA.aiSummary,
          todaySessions: data.todaySessions?.length ? data.todaySessions : FALLBACK_TRAINER_DATA.todaySessions,
          heatmap: data.heatmap?.length ? data.heatmap : FALLBACK_TRAINER_DATA.heatmap,
          activityFeed: data.activityFeed?.length ? data.activityFeed : FALLBACK_TRAINER_DATA.activityFeed,
          segments: data.segments?.length ? data.segments : FALLBACK_TRAINER_DATA.segments,
          spotlights: data.spotlights?.length ? data.spotlights : FALLBACK_TRAINER_DATA.spotlights,
          alerts: data.alerts?.length ? data.alerts : FALLBACK_TRAINER_DATA.alerts,
          winsThisWeek: data.winsThisWeek || [],
        });
        setSyncStatus(`Live sync ${new Date().toLocaleTimeString()}`);
      } catch (_err) {
        if (mounted) {
          setDashboardData(FALLBACK_TRAINER_DATA);
          setSyncStatus("Fallback mode");
        }
      }
    };

    loadDashboard();
    intervalId = window.setInterval(loadDashboard, 30000);
    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [apiFetch, user?.role]);

  const selectedSpotlight = useMemo(() => {
    const items = Array.isArray(dashboardData.spotlights) ? dashboardData.spotlights : [];
    return items.find((client) => client.name === selectedClient) || items[0] || {
      _id: null,
      name: "No client",
      goal: "No goal",
      adherence: "0%",
      status: "No data",
      note: "No spotlight data available yet.",
    };
  }, [dashboardData.spotlights, selectedClient]);

  const utilization = useMemo(() => {
    const capacity = Number(user?.trainerProfile?.clientCapacity || 0);
    if (!capacity) return 0;
    return Math.min(100, Math.round(((dashboardData.metrics?.activeClients || 0) / capacity) * 100));
  }, [dashboardData.metrics?.activeClients, user]);

  const metricItems = useMemo(
    () => [
      { label: "New Assessments", value: dashboardData.metrics?.newAssessments ?? 0, note: "Profiles waiting for first review" },
      { label: "Active Clients", value: dashboardData.metrics?.activeClients ?? 0, note: "Weekly coaching in progress" },
      { label: "Programs Due", value: dashboardData.metrics?.programsDue ?? 0, note: "Need workout refresh today" },
      { label: "Check-ins Pending", value: dashboardData.metrics?.checkinsPending ?? 0, note: "Unread client updates" },
    ],
    [dashboardData.metrics]
  );

  useEffect(() => {
    if (dashboardData.spotlights?.length && !dashboardData.spotlights.some((client) => client.name === selectedClient)) {
      setSelectedClient(dashboardData.spotlights[0].name);
    }
  }, [dashboardData.spotlights, selectedClient]);

  return (
    <div className={styles.layout}>
      <Sidebar active="trainer_dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Trainer workspace</p>
            <h1 className={styles.title}>{user?.name || "Trainer"}</h1>
            <p className={styles.subtitle}>
              {trainerTitle} dashboard focused on client follow-up, program delivery, and session planning.
            </p>
            <p className={styles.subtitle} style={{ marginTop: 8 }}>{syncStatus}</p>
          </div>
          <div className={styles.profileCard}>
            <div className={styles.profileValue}>{user?.trainerProfile?.experienceYears || 0}+ yrs</div>
            <div className={styles.profileLabel}>Coaching experience</div>
            <div className={styles.profileMeta}>
              Capacity {user?.trainerProfile?.clientCapacity || 0} clients
            </div>
            <div className={styles.capacityBar}>
              <span style={{ width: `${utilization}%` }} />
            </div>
            <div className={styles.capacityMeta}>Current load at {utilization || 0}% of available capacity</div>
          </div>
        </section>

        <section className={styles.summaryGrid}>
          {dashboardData.aiSummary.map((item) => (
            <article key={item.title} className={`${styles.summaryCard} ${styles[`tone_${item.tone}`]}`}>
              <p className={styles.summaryEyebrow}>AI Summary</p>
              <div className={styles.summaryTop}>
                <h2>{item.title}</h2>
                <span className={styles.summaryValue}>{item.value}</span>
              </div>
              <p className={styles.summaryNote}>{item.note}</p>
            </article>
          ))}
        </section>

        <section className={styles.metrics}>
          {metricItems.map((item) => (
            <article key={item.label} className={styles.metricCard}>
              <div className={styles.metricValue}>{item.value}</div>
              <div className={styles.metricLabel}>{item.label}</div>
              <div className={styles.metricNote}>{item.note}</div>
            </article>
          ))}
        </section>

        <section className={styles.grid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Today&apos;s Sessions</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("workout")}>Open Programs</button>
            </div>
            <div className={styles.sessionList}>
              {dashboardData.todaySessions.map((session) => (
                <div key={`${session.time}-${session.client}`} className={styles.sessionItem}>
                  <div className={styles.sessionTime}>{session.time}</div>
                  <div>
                    <div className={styles.sessionClient}>{session.client}</div>
                    <div className={styles.sessionFocus}>{session.focus}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Trainer Profile</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("settings")}>Edit</button>
            </div>
            <div className={styles.profileGrid}>
              <div>
                <span className={styles.fieldLabel}>Specialization</span>
                <strong>{user?.trainerProfile?.specialization || "Not set"}</strong>
              </div>
              <div>
                <span className={styles.fieldLabel}>Certifications</span>
                <strong>{user?.trainerProfile?.certifications || "Not set"}</strong>
              </div>
              <div>
                <span className={styles.fieldLabel}>Experience</span>
                <strong>{user?.trainerProfile?.experienceYears || 0} years</strong>
              </div>
              <div>
                <span className={styles.fieldLabel}>Client Capacity</span>
                <strong>{user?.trainerProfile?.clientCapacity || 0} clients</strong>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.coachGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Client Health Heatmap</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("workout")}>Open Programs</button>
            </div>
            <div className={styles.heatmapLegend}>
              <span><i className={`${styles.legendDot} ${styles.green}`} /> Active</span>
              <span><i className={`${styles.legendDot} ${styles.yellow}`} /> Inconsistent</span>
              <span><i className={`${styles.legendDot} ${styles.red}`} /> At risk</span>
            </div>
            <div className={styles.heatmapGrid}>
              {dashboardData.heatmap.map((client) => (
                <div key={client.name} className={`${styles.heatCell} ${styles[client.status]}`}>
                  <strong>{client.name}</strong>
                  <span>{client.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Real-Time Feed</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("settings")}>Tune Workflow</button>
            </div>
            <div className={styles.feedList}>
              {dashboardData.activityFeed.map((item) => (
                <div key={`${item.time}-${item.text}`} className={styles.feedItem}>
                  <span className={`${styles.feedMarker} ${styles[`tone_${item.type}`]}`} />
                  <div>
                    <div className={styles.feedText}>{item.text}</div>
                    <div className={styles.feedTime}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>🏆 Wins This Week</h2>
            </div>
            <div className={styles.feedList}>
              {(!dashboardData.winsThisWeek || dashboardData.winsThisWeek.length === 0) && (
                <p className={styles.feedText} style={{ padding: 12, color: "var(--muted)" }}>No badges earned this week yet. Follow up to encourage consistency!</p>
              )}
              {dashboardData.winsThisWeek && dashboardData.winsThisWeek.map((win, idx) => (
                <div key={idx} className={styles.feedItem}>
                  <span style={{ fontSize: "1.2rem", marginRight: "12px", display: "flex", alignItems: "center" }}>{win.icon}</span>
                  <div>
                    <div className={styles.feedText}>{win.clientName} earned <strong>{win.badgeName}</strong></div>
                    <div className={styles.feedTime}>{new Date(win.earnedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.moduleGrid}>
          {TRAINER_MODULES.map((module) => (
            <article key={module.title} className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <h2>{module.title}</h2>
                <span className={styles.moduleBadge}>Trainer only</span>
              </div>
              <ul>
                {module.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className={styles.moduleGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Client Segments</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("workout")}>Assign Plans</button>
            </div>
            <div className={styles.resourceList}>
              {dashboardData.segments.map((segment) => (
                <div key={segment.name} className={styles.segmentItem}>
                  <div className={styles.segmentTop}>
                    <strong>{segment.name}</strong>
                    <span>{segment.count} clients</span>
                  </div>
                  <p>{segment.note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Client Spotlight</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("workout")}>Assign Plans</button>
            </div>
            <div className={styles.clientTabs}>
              {dashboardData.spotlights.map((client) => (
                <button
                  key={client.name}
                  className={`${styles.clientTab} ${selectedClient === client.name ? styles.clientTabActive : ""}`}
                  onClick={() => setSelectedClient(client.name)}
                >
                  {client.name}
                </button>
              ))}
            </div>
            <div className={styles.spotlightCard}>
              <div className={styles.spotlightTop}>
                <div>
                  <div className={styles.spotlightName}>{selectedSpotlight.name}</div>
                  <div className={styles.spotlightGoal}>{selectedSpotlight.goal}</div>
                </div>
                <div className={styles.spotlightScore}>{selectedSpotlight.adherence}</div>
              </div>
              <div className={styles.spotlightStatus}>{selectedSpotlight.status}</div>
              <p className={styles.spotlightNote}>{selectedSpotlight.note}</p>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Coaching Alerts</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("settings")}>Tune Workflow</button>
            </div>
            <div className={styles.alertList}>
              {dashboardData.alerts.map((alert) => (
                <div key={alert} className={styles.alertItem}>
                  <span className={styles.alertDot} />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.moduleGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Weekly Focus Board</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("workout")}>Build Schedule</button>
            </div>
            <div className={styles.focusBoard}>
              {WEEKLY_FOCUS.map((item) => (
                <div key={item.day} className={styles.focusItem}>
                  <div className={styles.focusDay}>{item.day}</div>
                  <div className={styles.focusTheme}>{item.theme}</div>
                  <div className={styles.focusLoad}>{item.load}</div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Smart Calendar Load</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("workout")}>Manage Sessions</button>
            </div>
            <div className={styles.loadList}>
              {CALENDAR_LOAD.map((item) => (
                <div key={item.slot} className={styles.loadItem}>
                  <div>
                    <strong>{item.slot}</strong>
                    <p>{item.note}</p>
                  </div>
                  <span className={`${styles.loadBadge} ${styles[`load_${item.level}`]}`}>{item.load}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Trainer Resources</h2>
              <button className={styles.panelLink} onClick={() => onNavigate("workout")}>Open Builder</button>
            </div>
            <div className={styles.resourceList}>
              {RESOURCE_LIBRARY.map((resource) => (
                <div key={resource.title} className={styles.resourceItem}>
                  <strong>{resource.title}</strong>
                  <span>{resource.meta}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.actions}>
          {QUICK_ACTIONS.map((action) => (
            <button key={action.title} className={styles.actionCard} onClick={() => onNavigate(action.target)}>
              <span className={styles.actionTitle}>{action.title}</span>
              <span className={styles.actionDesc}>{action.desc}</span>
            </button>
          ))}
        </section>
      </main>
      <TrainerChatPanel selectedClientId={selectedSpotlight?._id} selectedClientName={selectedSpotlight?.name} />
    </div>
  );
}
