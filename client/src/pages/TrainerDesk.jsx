import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const CLIENT_PIPELINE = [
  { label: "New Assessments", value: 6, note: "Profiles waiting for first review" },
  { label: "Active Clients", value: 18, note: "Weekly coaching in progress" },
  { label: "Programs Due", value: 4, note: "Need workout refresh today" },
  { label: "Check-ins Pending", value: 7, note: "Unread client updates" },
];

const TODAY_SESSIONS = [
  { time: "06:30 AM", client: "Nivetha R", focus: "Mobility + core reset", status: "scheduled" },
  { time: "11:00 AM", client: "Asha K", focus: "PCOD-friendly cardio block", status: "scheduled" },
  { time: "05:45 PM", client: "Divya P", focus: "Strength progression review", status: "completed" },
];

const FALLBACK_TRAINER_DATA = {
  metrics: {
    newAssessments: CLIENT_PIPELINE[0].value,
    activeClients: CLIENT_PIPELINE[1].value,
    programsDue: CLIENT_PIPELINE[2].value,
    checkinsPending: CLIENT_PIPELINE[3].value,
  },
  todaySessions: TODAY_SESSIONS,
};

export default function TrainerDesk({ onNavigate, onLogout }) {
  const { user, apiFetch } = useAuth();
  const [dashboardData, setDashboardData] = useState(FALLBACK_TRAINER_DATA);
  const [syncStatus, setSyncStatus] = useState("Live");

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
          todaySessions: data.todaySessions?.length ? data.todaySessions : FALLBACK_TRAINER_DATA.todaySessions,
        });
        setSyncStatus(`Sync active • ${new Date().toLocaleTimeString()}`);
      } catch (_err) {
        if (mounted) {
          setDashboardData(FALLBACK_TRAINER_DATA);
          setSyncStatus("Fallback mode (Offline)");
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

  const trainerTitle = useMemo(() => {
    const specialization = user?.trainerProfile?.specialization?.trim();
    return specialization ? specialization : "Wellness Coach";
  }, [user]);

  const activeCount = dashboardData.metrics?.activeClients || 0;
  const capacityCount = user?.trainerProfile?.clientCapacity || 20;
  const utilization = Math.min(100, Math.round((activeCount / capacityCount) * 100)) || 0;

  return (
    <div className="trainer-theme trainer-layout">
      <Sidebar active="trainer_dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="trainer-content">
        {/* Header - Clean Row */}
        <div className="flex items-center justify-between mb-24">
          <div>
            <div className="flex items-center gap-16" style={{ marginBottom: "8px" }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>{user?.name || "Trainer"}</h1>
              <span className="badge badge-outline-green">{trainerTitle}</span>
              <span className="badge badge-gray">{user?.trainerProfile?.experienceYears || 0}+ yrs</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>{syncStatus}</div>
          </div>

          <div style={{ minWidth: "260px" }}>
            <div className="flex justify-between" style={{ marginBottom: "6px", fontSize: "14px", fontWeight: "600" }}>
              <span>Capacity</span>
              <span>{activeCount} / {capacityCount} clients</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "var(--bg-card)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
              <div style={{ height: "100%", width: `${utilization}%`, background: "var(--accent-green)", borderRadius: "4px" }}></div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <section className="grid grid-cols-4 gap-16 mb-24">
          <div className="stat-card">
            <div className="stat-card-number">{activeCount}</div>
            <div className="stat-card-label">Active Clients</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-number">{dashboardData.metrics?.newAssessments || 0}</div>
            <div className="stat-card-label">New Assessments</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-number">{dashboardData.metrics?.programsDue || 0}</div>
            <div className="stat-card-label">Programs Due</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-number" style={{ color: "var(--warning-color)" }}>{dashboardData.metrics?.checkinsPending || 0}</div>
            <div className="stat-card-label">Check-ins Pending</div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-2 gap-24">
          {/* Sessions Table */}
          <section className="trainer-card" style={{ padding: "0" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)" }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Today's Sessions</h2>
            </div>
            {dashboardData.todaySessions.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No sessions today</div>
            ) : (
              <div>
                <div className="table-header">
                  <div>Time</div>
                  <div>Client Label</div>
                  <div>Session Focus</div>
                  <div style={{ textAlign: "right" }}>Status</div>
                </div>
                {dashboardData.todaySessions.map((session, i) => (
                  <div key={i} className="table-row">
                    <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>{session.time}</div>
                    <div style={{ fontWeight: "600" }}>{session.client}</div>
                    <div style={{ fontSize: "14px" }}>{session.focus}</div>
                    <div style={{ textAlign: "right" }}>
                      {session.status === "scheduled" ? (
                        <span className="badge badge-green">Scheduled</span>
                      ) : session.status === "missed" ? (
                        <span className="badge badge-red">Missed</span>
                      ) : (
                        <span className="badge badge-gray">Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
             <h2 className="section-title">Quick Actions</h2>
             <div className="flex-col gap-16">
               <button className="btn-outline w-full" onClick={() => onNavigate("clients")} style={{ display: "flex", justifyContent: "flex-start", padding: "16px 20px" }}>
                 <span style={{ fontSize: "20px", marginRight: "16px" }}>+</span> Add / Manage Clients
               </button>
               <button className="btn-outline w-full" onClick={() => onNavigate("workout")} style={{ display: "flex", justifyContent: "flex-start", padding: "16px 20px" }}>
                 <span style={{ fontSize: "20px", marginRight: "16px" }}>📋</span> Create Program
               </button>
               <button className="btn-outline w-full" onClick={() => onNavigate("settings")} style={{ display: "flex", justifyContent: "flex-start", padding: "16px 20px" }}>
                 <span style={{ fontSize: "20px", marginRight: "16px" }}>👤</span> Edit Profile Settings
               </button>
             </div>
          </section>
        </div>

      </main>
    </div>
  );
}
