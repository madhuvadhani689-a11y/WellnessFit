import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const TABS = ["All", "PCOD Care", "Fat Loss", "Strength", "Weight Gain"];

const getAvatar = (name) => {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

const getGoalColor = (goal) => {
  switch (goal) {
    case "PCOD Care": return "purple";
    case "Fat Loss": return "orange";
    case "Strength": return "blue";
    case "Weight Gain": return "green";
    default: return "gray";
  }
};

const normalizeGoal = (g) => {
  if (g === "loss") return "Fat Loss";
  if (g === "gain") return "Weight Gain";
  if (g === "pcod") return "PCOD Care";
  return g || "Unknown";
};

export default function ClientManagement({ onNavigate, onLogout }) {
  const { user, apiFetch } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
         const data = await apiFetch(`/api/trainer/clients/${user._id}`);
         const formatted = data.map((c) => {
           const logTime = new Date(c.lastLogDate).getTime();
           const daysAgo = Math.floor((Date.now() - logTime) / 86400000);
           const goalText = normalizeGoal(c.fitnessGoal);
           return {
             id: c._id,
             name: c.name,
             goal: goalText,
             cycle: c.cyclePhase === "N/A" ? "N/A" : `${c.cycleDay} · ${c.cyclePhase}`,
             weightText: `${c.currentWeight}kg → ${c.targetWeight}kg target`,
             logsAgo: isNaN(daysAgo) ? 0 : daysAgo,
             avatar: getAvatar(c.name),
             color: getGoalColor(goalText)
           };
         });
         setClients(formatted);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
    };
    if (user?._id) fetchClients();
  }, [user?._id, apiFetch]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (activeTab !== "All" && c.goal !== activeTab) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activeTab, clients]);

  return (
    <div className="trainer-theme trainer-layout">
      <Sidebar active="clients" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="trainer-content">
        <div className="flex items-center justify-between mb-24">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Client Management</h1>
          <div style={{ width: "300px" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search clients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-16 mb-24" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "transparent",
                border: "none",
                color: activeTab === tab ? "var(--accent-green)" : "var(--text-muted)",
                fontWeight: activeTab === tab ? "bold" : "600",
                fontSize: "15px",
                cursor: "pointer",
                padding: "8px 0"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)" }}>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)", fontSize: "16px" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px", color: "var(--text-primary)" }}>No clients assigned yet 🌿</div>
            <div>Share your trainer code with clients to connect them to your dashboard</div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)", fontSize: "16px" }}>
            No clients found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-24">
            {filteredClients.map(client => (
              <div key={client.id} className="trainer-card flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: "16px" }}>
                    <div className="flex items-center gap-16">
                       <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--accent-green)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" }}>
                         {client.avatar}
                       </div>
                       <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--text-primary)" }}>{client.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                       <span className={`badge badge-${client.color}`}>{client.goal}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "16px 0", marginBottom: "16px" }}>
                    <div className="flex justify-between" style={{ marginBottom: "8px", fontSize: "14px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Weight:</span>
                      <span style={{ fontWeight: "600" }}>{client.weightText}</span>
                    </div>
                    <div className="flex justify-between" style={{ marginBottom: "8px", fontSize: "14px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Cycle Phase:</span>
                      <span style={{ fontWeight: "600" }}>{client.cycle}</span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: "14px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Last log:</span>
                      <span style={{ fontWeight: "600", color: client.logsAgo > 3 ? "var(--danger-color)" : "var(--text-primary)" }}>
                        {client.logsAgo === 0 ? "Today" : `${client.logsAgo} days ago`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-16">
                  <button className="btn-outline w-full" onClick={() => {
                    localStorage.setItem("wf_active_client_id", client.id);
                    onNavigate("client_detail");
                  }}>View Profile</button>
                  <button className="btn-filled w-full" onClick={() => onNavigate("workout")}>Assign Plan</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

