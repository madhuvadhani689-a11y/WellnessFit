import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import styles from "./AdminDashboard.module.css";

const MODULES = [
  {
    title: "User Management",
    points: ["View, edit, or suspend users", "Audit goal and health setup", "Track account growth by role"],
  },
  {
    title: "Trainer Management",
    points: ["Review trainer applications", "Approve trainers and assign clients", "Monitor trainer capacity"],
  },
  {
    title: "Content Management",
    points: ["Add PCOD articles", "Update diet tips", "Expand workout library"],
  },
  {
    title: "Analytics",
    points: ["Total users and trainers", "Engagement overview", "Plan adoption and adherence"],
  },
  {
    title: "Subscription / Plans",
    points: ["Free vs premium plan setup", "Feature gating", "Upgrade tracking"],
  },
  {
    title: "System Settings",
    points: ["Notification defaults", "Reminder channels", "Global app configuration"],
  },
];

const STATS = [
  { label: "Total Users", value: "1,284" },
  { label: "Active Trainers", value: "38" },
  { label: "Premium Plans", value: "412" },
  { label: "Weekly Engagement", value: "76%" },
];

export default function AdminDashboard({ onNavigate, onLogout }) {
  const { user } = useAuth();

  return (
    <div className={styles.layout}>
      <Sidebar active="admin_dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Admin control center</p>
            <h1 className={styles.title}>{user?.name || "Admin"}</h1>
            <p className={styles.subtitle}>
              Central workspace for platform operations, staff oversight, content, and subscription control.
            </p>
          </div>
          <div className={styles.notice}>
            <strong>Admin-only access</strong>
            <span>Public signup is blocked. This portal is reserved for platform management.</span>
          </div>
        </section>

        <section className={styles.stats}>
          {STATS.map((item) => (
            <article key={item.label} className={styles.statCard}>
              <div className={styles.statValue}>{item.value}</div>
              <div className={styles.statLabel}>{item.label}</div>
            </article>
          ))}
        </section>

        <section className={styles.moduleGrid}>
          {MODULES.map((module) => (
            <article key={module.title} className={styles.moduleCard}>
              <h2>{module.title}</h2>
              <ul>
                {module.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className={styles.quickBar}>
          <button className={styles.quickBtn} onClick={() => onNavigate("analytics")}>Open Platform Analytics</button>
          <button className={styles.quickBtn} onClick={() => onNavigate("settings")}>Open System Settings</button>
        </section>
      </main>
    </div>
  );
}
