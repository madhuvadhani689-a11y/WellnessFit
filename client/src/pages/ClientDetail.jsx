import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ClientDetail({ onNavigate, onLogout }) {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const clientId = localStorage.getItem("wf_active_client_id");

  useEffect(() => {
    if (!clientId) {
      onNavigate("clients");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await apiFetch(`/api/clients/${clientId}/full`);
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId, apiFetch, onNavigate]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "white", padding: "12px", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>{label}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ color: "var(--accent-green, #10b981)", fontWeight: 500, margin: 0 }}>Weight: {payload[0]?.value}kg</p>
            {payload[1] && <p style={{ color: "var(--gold, #C9A84C)", fontWeight: 500, margin: 0 }}>Body Fat: {payload[1].value}%</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  const getHeatmapColor = (status) => {
    if (status === "completed") return "#4ade80"; 
    if (status === "skipped") return "#f87171"; 
    if (status === "scheduled") return "#60a5fa"; 
    return "#ebedf0"; 
  };

  if (loading) {
     return (
       <div className="trainer-theme trainer-layout" style={{ display: "flex", height: "100vh" }}>
         <Sidebar active="clients" onNavigate={onNavigate} onLogout={onLogout} />
         <main style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ color: "#6b7280" }}>Loading Client Profile...</div>
         </main>
       </div>
     );
  }

  if (!data) return null;

  return (
    <div className="trainer-theme" style={{ display: "flex", height: "100vh", backgroundColor: "#fff" }}>
      <Sidebar active="clients" onNavigate={onNavigate} onLogout={onLogout} />
      
      <main style={{ flex: 1, overflowY: "auto", padding: "48px 64px", color: "#111827", fontFamily: "Inter, sans-serif" }}>
        
        {/* Breadcrumb / Back */}
        <button 
           onClick={() => onNavigate("clients")}
           style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0, marginBottom: "32px", fontWeight: 500 }}
        >
          ← Back to Clients
        </button>

        {/* Header Block */}
        <div style={{ marginBottom: "48px" }}>
           <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "16px" }}>
             {data.header.name}
           </h1>
           <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ padding: "4px 12px", background: "#f3f4f6", borderRadius: "100px", fontSize: "14px", fontWeight: 600 }}>
                Goal: {data.header.goal.toUpperCase()}
              </span>
              <span style={{ padding: "4px 12px", background: "#eef2ff", color: "#4f46e5", borderRadius: "100px", fontSize: "14px", fontWeight: 600 }}>
                {data.header.experienceTag}
              </span>
              <span style={{ fontSize: "14px", color: "#6b7280", marginLeft: "8px" }}>
                Active since {new Date(data.header.activeSince).toLocaleDateString()}
              </span>
           </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "48px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
             
             {/* Graph Card */}
             {data.bodyMetrics && data.bodyMetrics.length > 0 && (
               <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                 <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "24px", letterSpacing: "-0.01em" }}>Body Metrics</h3>
                 <div style={{ height: "300px", width: "100%" }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={data.bodyMetrics} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                       <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                       <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                       <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} hide={!data.bodyMetrics.some(m => m.bodyFat)} />
                       <Tooltip content={<CustomTooltip />} />
                       <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                       {data.bodyMetrics.some(m => m.bodyFat) && (
                         <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                       )}
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               </div>
             )}

             {/* Heatmap Card */}
             <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
               <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", letterSpacing: "-0.01em" }}>90-Day Attendance</h3>
               <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>Tracks completed vs skipped scheduled workouts.</p>
               
               <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: "6px" }}>
                 {data.heatmap.map((day, i) => (
                   <div 
                     key={i} 
                     title={`${day.date}: ${day.status}`}
                     style={{
                       aspectRatio: "1",
                       backgroundColor: getHeatmapColor(day.status),
                       borderRadius: "3px",
                       cursor: "pointer",
                       transition: "transform 0.1s",
                     }}
                     onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                     onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                   />
                 ))}
               </div>
               
               <div style={{ display: "flex", gap: "16px", marginTop: "24px", fontSize: "13px", color: "#6b7280" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: 12, height: 12, background: "#4ade80", borderRadius: 2 }} /> Completed</div>
                 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: 12, height: 12, background: "#f87171", borderRadius: 2 }} /> Skipped</div>
                 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: 12, height: 12, background: "#60a5fa", borderRadius: 2 }} /> Scheduled</div>
                 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: 12, height: 12, background: "#ebedf0", borderRadius: 2 }} /> None</div>
               </div>
             </div>

          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Tags / Preferences */}
            <div>
               <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Tags & Constraints</h4>
               <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                 {data.tags.map(tag => (
                   <div key={tag} style={{ padding: "8px 12px", background: "#fef3c7", color: "#b45309", borderRadius: "6px", fontSize: "14px", fontWeight: 500, display: "inline-block", alignSelf: "flex-start" }}>
                     {tag}
                   </div>
                 ))}
               </div>
            </div>

            {/* Next Scheduled */}
            <div>
               <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Up Next</h4>
               {data.nextSession ? (
                 <div style={{ padding: "16px", border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: "10px" }}>
                   <p style={{ fontSize: "16px", fontWeight: 600, color: "#1e3a8a", marginBottom: "4px" }}>{data.nextSession.focus}</p>
                   <p style={{ fontSize: "14px", color: "#3b82f6" }}>📅 {new Date(data.nextSession.date).toLocaleDateString()}</p>
                 </div>
               ) : (
                 <p style={{ fontSize: "14px", color: "#9ca3af", fontStyle: "italic" }}>No upcoming sessions scheduled.</p>
               )}
            </div>

            {/* Recents */}
            <div style={{ flex: 1 }}>
               <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Recent Sessions</h4>
               <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                 {data.recentSessions.length === 0 && (
                   <p style={{ fontSize: "14px", color: "#9ca3af", fontStyle: "italic" }}>No history found.</p>
                 )}
                 {data.recentSessions.map(session => (
                   <div key={session.id} style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "10px", background: session.status === "skipped" ? "#fef2f2" : "#fff"  }}>
                     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                       <span style={{ fontSize: "14px", fontWeight: 600 }}>{session.focus}</span>
                       <span style={{ fontSize: "12px", color: session.status === "skipped" ? "#ef4444" : "#10b981", fontWeight: 600, padding: "2px 8px", borderRadius: "100px", background: session.status === "skipped" ? "#fee2e2" : "#d1fae5" }}>
                         {session.status}
                       </span>
                     </div>
                     <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>{new Date(session.date).toLocaleDateString()}</p>
                     {session.trainerNotes && (
                       <div style={{ background: "#f3f4f6", padding: "10px 12px", borderRadius: "6px", fontSize: "13px", color: "#4b5563", borderLeft: "3px solid #d1d5db" }}>
                         {session.trainerNotes}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
