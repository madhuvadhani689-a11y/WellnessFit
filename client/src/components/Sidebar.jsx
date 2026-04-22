import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";
import "../trainer-layout.css";

const USER_NAV = [
  { id: "dashboard", icon: "\u{1F3E0}", label: "Dashboard" },
  { id: "weight", icon: "\u2696\uFE0F", label: "Weight" },
  { id: "nutrition", icon: "\u{1F957}", label: "Nutrition" },
  { id: "recipes", icon: "\u{1F373}", label: "Recipes" },
  { id: "pcod", icon: "\u{1F338}", label: "PCOD Tracker" },
  { id: "workout", icon: "\u{1F4AA}", label: "Workout Planner" },
];

const USER_EXTRA = [
  { id: "analytics", icon: "\u{1F4CA}", label: "Analytics" },
  { id: "mindfulness", icon: "\u{1F9D8}", label: "Mindfulness" },
  { id: "settings", icon: "\u2699\uFE0F", label: "Settings" },
];

const TRAINER_NAV = [
  { id: "trainer_dashboard", icon: "\u{1F4CB}", label: "Trainer Desk" },
  { id: "clients", icon: "\u{1F465}", label: "Clients" },
  { id: "workout", icon: "\u{1F4AA}", label: "Programs" },
  { id: "settings", icon: "\u{1F464}", label: "My Profile" },
];

const ADMIN_NAV = [
  { id: "admin_dashboard", icon: "\u{1F6E0}\uFE0F", label: "Admin Desk" },
  { id: "analytics", icon: "\u{1F4C8}", label: "Platform Analytics" },
  { id: "settings", icon: "\u2699\uFE0F", label: "System Settings" },
];

const GOAL_LABEL = { loss: "Weight Loss", gain: "Weight Gain", pcod: "PCOD Care" };

export default function Sidebar({ active, onNavigate, onLogout }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isTrainer = user?.role === "trainer";
  const showPCOD = !user?.gender || user?.gender === 'female' || user?.gender === 'prefer_not_to_say';
  const filteredUserNav = USER_NAV.filter(item => item.id !== "pcod" || showPCOD);
  
  const primaryNav = isAdmin ? ADMIN_NAV : isTrainer ? TRAINER_NAV : filteredUserNav;
  const extraNav = isAdmin || isTrainer ? [] : USER_EXTRA;
  const roleLabel = isAdmin
    ? "Administrator"
    : isTrainer
    ? user?.trainerProfile?.specialization || "Trainer"
    : GOAL_LABEL[user?.goal] || "Wellness";

  if (isTrainer) {
    return (
      <aside className="trainer-sidebar">
        <div style={{ padding: "0 24px", marginBottom: "32px" }}>
          <div style={{ color: "var(--sidebar-text)", fontSize: "24px", fontWeight: "bold" }}>Trainer<span style={{ color: "var(--accent-green)" }}>Pro</span></div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          {primaryNav.map(({ id, icon, label }) => (
            <button
              key={id}
              type="button"
              className={`trainer-sidebar-item ${active === id ? "active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <span style={{ width: "24px", textAlign: "center" }}>{icon}</span> {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
             <div style={{ width: "36px", height: "36px", background: "var(--bg-primary)", color: "var(--accent-green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{user?.name?.[0] || "T"}</div>
             <div>
               <div style={{ color: "var(--sidebar-text)", fontSize: "14px", fontWeight: "600" }}>{user?.name || "Trainer"}</div>
               <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{user?.trainerProfile?.specialization || "Wellness Coach"}</div>
             </div>
          </div>
          <button className="btn-outline" style={{ width: "100%", padding: "8px", fontSize: "13px" }} type="button" onClick={onLogout}>Sign out</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Wellness<span>Fit</span></div>

      <nav className={styles.nav}>
        {primaryNav.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            className={`${styles.navItem} ${active === id ? styles.active : ""}`}
            onClick={() => onNavigate(id)}
          >
            <span className={styles.icon}>{icon}</span> {label}
          </button>
        ))}

        {extraNav.length ? <div className={styles.divider} /> : null}

        {extraNav.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            className={`${styles.navItem} ${active === id ? styles.active : ""}`}
            onClick={() => onNavigate(id)}
          >
            <span className={styles.icon}>{icon}</span> {label}
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>{user?.name?.[0] || "U"}</div>
          <div>
            <div className={styles.userName}>{user?.name || "User"}</div>
            <div className={styles.userGoal}>{roleLabel}</div>
          </div>
        </div>
        <button className={styles.logoutBtn} type="button" onClick={onLogout}>Sign out</button>
      </div>
    </aside>
  );
}
