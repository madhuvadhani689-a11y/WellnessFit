import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

export default function TrainerSettings({ onNavigate, onLogout }) {
  const { user, apiFetch, login, token } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    specialization: "",
    certifications: "",
    experienceYears: "",
    bio: "",
    clientCapacity: 20,
    workingHours: "08:00 AM - 06:00 PM",
    workingDays: "Mon-Sat"
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        whatsappNumber: user.whatsappNumber || "",
        specialization: user.trainerProfile?.specialization || "Wellness Coach",
        certifications: user.trainerProfile?.certifications || "",
        experienceYears: user.trainerProfile?.experienceYears || "",
        bio: user.trainerProfile?.bio || "",
        clientCapacity: user.trainerProfile?.clientCapacity || 20,
        workingHours: user.trainerProfile?.workingHours || "08:00 AM - 06:00 PM",
        workingDays: user.trainerProfile?.workingDays || "Mon-Sat"
      });
    }
  }, [user]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const payload = {
        name: form.name,
        whatsappNumber: form.whatsappNumber,
        trainerProfile: {
          specialization: form.specialization,
          certifications: form.certifications,
          experienceYears: Number(form.experienceYears),
          bio: form.bio,
          clientCapacity: Number(form.clientCapacity),
          workingHours: form.workingHours,
          workingDays: form.workingDays
        }
      };

      const data = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      login(data.user, token);
      setStatus("Settings saved successfully.");
    } catch (err) {
      setStatus(err.message || "Failed to save settings.");
    }
  };

  return (
    <div className="trainer-theme trainer-layout">
      <Sidebar active="settings" onNavigate={onNavigate} onLogout={onLogout} />
      
      <main className="trainer-content">
        
        <div className="flex items-center justify-between mb-24">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Trainer Settings</h1>
        </div>

        <form onSubmit={save} className="flex-col gap-24">
          {/* Section 1: Professional Profile */}
          <section className="trainer-card">
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 className="section-title" style={{ margin: 0 }}>Professional Profile</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-16 mb-24">
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" value={form.email} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-24">
              <div>
                <label className="form-label">WhatsApp Number</label>
                <input className="form-input" value={form.whatsappNumber} onChange={(e) => updateField("whatsappNumber", e.target.value)} />
              </div>
              <div>
                <label className="form-label">Experience (Years)</label>
                <input className="form-input" type="number" min="0" value={form.experienceYears} onChange={(e) => updateField("experienceYears", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-24">
              <div>
                <label className="form-label">Specialization</label>
                <input className="form-input" value={form.specialization} onChange={(e) => updateField("specialization", e.target.value)} placeholder="e.g. Strength, PCOD Care" />
              </div>
              <div>
                <label className="form-label">Certifications</label>
                <input className="form-input" value={form.certifications} onChange={(e) => updateField("certifications", e.target.value)} placeholder="e.g. ACE, NASM" />
              </div>
            </div>

            <div>
              <label className="form-label">Coach Bio</label>
              <textarea className="form-textarea" rows="3" value={form.bio} onChange={(e) => updateField("bio", e.target.value)} placeholder="Short introductory bio shown to clients..." />
            </div>

            <div style={{ marginTop: "24px", padding: "16px", background: "var(--bg-stat)", borderRadius: "8px", border: "1px dashed var(--accent-green)" }}>
               <label className="form-label" style={{ color: "var(--accent-green)", fontWeight: 600 }}>Your Trainer Code</label>
               <div className="flex justify-between items-center">
                 <span style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "2px" }}>{user?._id?.slice(-6).toUpperCase()}</span>
                 <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>Share this 6-character code with clients so they can connect with you.</p>
               </div>
            </div>
          </section>

          {/* Section 2: Capacity & Schedule */}
          <section className="trainer-card">
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 className="section-title" style={{ margin: 0 }}>Capacity & Schedule</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-16">
              <div>
                <label className="form-label">Maximum Assigned Clients</label>
                <input className="form-input" type="number" min="1" value={form.clientCapacity} onChange={(e) => updateField("clientCapacity", e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Active Working Hours</label>
                <input className="form-input" value={form.workingHours} onChange={(e) => updateField("workingHours", e.target.value)} placeholder="08:00 AM - 06:00 PM" />
              </div>
              <div>
                <label className="form-label">Active Working Days</label>
                <input className="form-input" value={form.workingDays} onChange={(e) => updateField("workingDays", e.target.value)} placeholder="Mon-Sat" />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-16 justify-between items-center" style={{ marginTop: "12px" }}>
            <div style={{ color: "var(--accent-green)", fontWeight: 600 }}>{status}</div>
            <button type="submit" className="btn-filled" style={{ width: "auto", padding: "12px 32px" }}>Save Settings</button>
          </div>
        </form>

      </main>
    </div>
  );
}
