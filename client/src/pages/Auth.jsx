import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

const GOALS = [
  { value: "loss", emoji: "\u{1F957}", label: "Weight Loss" },
  { value: "gain", emoji: "\u{1F4AA}", label: "Weight Gain" },
  { value: "pcod", emoji: "\u{1F338}", label: "PCOD Care" },
];

const PORTALS = [
  { id: "user", label: "User Portal", accent: "Daily wellness tracking" },
  { id: "trainer", label: "Trainer Portal", accent: "Coach and manage clients" },
  { id: "admin", label: "Admin Portal", accent: "System and staff access" },
];

export default function Auth({ onLogin, onBack, allowedPortals = ["user", "trainer"], initialPortal = "user", hideBackToHome = false }) {
  const { login, apiFetch } = useAuth();
  const visiblePortals = PORTALS.filter((item) => allowedPortals.includes(item.id));
  const [portal, setPortal] = useState(() => (allowedPortals.includes(initialPortal) ? initialPortal : allowedPortals[0] || "user"));
  const [mode, setMode] = useState("login");
  const [goal, setGoal] = useState("loss");
  const [form, setForm] = useState({
    name: "",
    gender: "",
    email: "",
    password: "",
    age: "",
    heightCm: "",
    startingWeight: "",
    targetWeight: "",
  });
  const [trainerForm, setTrainerForm] = useState({
    specialization: "",
    experienceYears: "",
    certifications: "",
    clientCapacity: "",
  });
  const [error, setError] = useState("");
  const [helperText, setHelperText] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdminPortal = portal === "admin";
  const isTrainerPortal = portal === "trainer";
  const currentMode = isAdminPortal ? "login" : mode;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setTrainer = (k) => (e) => setTrainerForm((f) => ({ ...f, [k]: e.target.value }));

  const switchPortal = (nextPortal) => {
    setPortal(nextPortal);
    setError("");
    setHelperText("");
    if (nextPortal === "admin") {
      setMode("login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentMode === "register" && !isAdminPortal && !isTrainerPortal && !form.gender) {
      setError("Please select one gender option from 'I am a...' list.");
      return;
    }
    setError("");
    setHelperText("");
    setLoading(true);
    try {
      const endpoint = currentMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const role = portal === "trainer" ? "trainer" : portal === "admin" ? "admin" : "user";
      const body =
        currentMode === "login"
          ? { email: form.email, password: form.password, role }
          : isTrainerPortal
            ? { ...form, role, trainerProfile: trainerForm }
            : { ...form, goal, role };

      const data = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      login(data.user, data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError("");
    setHelperText("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/demo", { method: "POST" });
      login(data.user, data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const title =
    currentMode === "login"
      ? portal === "trainer"
        ? "Trainer Sign In"
        : portal === "admin"
          ? "Admin Sign In"
          : "Welcome back"
      : portal === "trainer"
        ? "Create Trainer Account"
        : "Create account";

  return (
    <div className={styles.page}>
      <div className={styles.visual}>
        <div className={styles.visLogo}>Wellness<span>Fit</span></div>
        <h2 className={styles.visTitle}>One platform,<br />multiple access portals</h2>
        <p className={styles.visDesc}>
          Users track wellness, trainers guide progress, and admins manage the system with separate access.
        </p>
        <ul className={styles.visList}>
          {[
            "User wellness tracking and personalized plans",
            "Trainer coaching workflows and follow-up",
            "Admin-only access separated from public signup",
            "Role-aware sign in with safer account routing",
          ].map((f) => (
            <li key={f}>
              <span className={styles.dot} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.formWrap}>
        <div className={styles.formBox}>
          {!hideBackToHome ? (
            <button className="btn btn-ghost" style={{ padding: "8px 14px", marginBottom: 20, fontSize: ".82rem" }} onClick={onBack}>
              Back to Home
            </button>
          ) : null}

          {visiblePortals.length > 1 ? (
            <div className={styles.portalGrid}>
              {visiblePortals.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.portalBtn} ${portal === item.id ? styles.portalBtnActive : ""}`}
                  onClick={() => switchPortal(item.id)}
                >
                  <span className={styles.portalLabel}>{item.label}</span>
                  <span className={styles.portalAccent}>{item.accent}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.portalSingle}>
              <span className={styles.portalLabel}>{visiblePortals[0]?.label || "Portal"}</span>
              <span className={styles.portalAccent}>{visiblePortals[0]?.accent || ""}</span>
            </div>
          )}

          <h1 className={styles.formTitle}>{title}</h1>
          <p className={styles.formSub}>
            {isAdminPortal
              ? "Admin access is login-only."
              : currentMode === "login"
                ? "Need a new account? "
                : "Already have an account? "}
            {!isAdminPortal ? (
              <button
                className={styles.switchLink}
                type="button"
                onClick={() => {
                  setMode(currentMode === "login" ? "register" : "login");
                  setError("");
                  setHelperText("");
                }}
              >
                {currentMode === "login" ? `Sign up as ${portal}` : "Sign in"}
              </button>
            ) : null}
          </p>

          {!isAdminPortal ? (
            <div className={styles.tabs}>
              <button type="button" className={`${styles.tab} ${currentMode === "login" ? styles.active : ""}`} onClick={() => setMode("login")}>Sign In</button>
              <button type="button" className={`${styles.tab} ${currentMode === "register" ? styles.active : ""}`} onClick={() => setMode("register")}>Sign Up</button>
            </div>
          ) : null}

          {error ? <div className={styles.error}>{error}</div> : null}

          <form onSubmit={handleSubmit}>
            {currentMode === "register" ? (
              <>
                {isTrainerPortal ? (
                  <>
                    <div className={styles.row2}>
                      <div>
                        <label className="form-label">Trainer Name *</label>
                        <input className="form-input" placeholder="Coach name" value={form.name} onChange={set("name")} required />
                      </div>
                      <div>
                        <label className="form-label">Specialization *</label>
                        <input
                          className="form-input"
                          placeholder="Strength, PCOD wellness, yoga"
                          value={trainerForm.specialization}
                          onChange={setTrainer("specialization")}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.row2} style={{ marginTop: 14 }}>
                      <div>
                        <label className="form-label">Experience (years)</label>
                        <input
                          className="form-input"
                          type="number"
                          placeholder="4"
                          value={trainerForm.experienceYears}
                          onChange={setTrainer("experienceYears")}
                        />
                      </div>
                      <div>
                        <label className="form-label">Client Capacity</label>
                        <input
                          className="form-input"
                          type="number"
                          placeholder="25"
                          value={trainerForm.clientCapacity}
                          onChange={setTrainer("clientCapacity")}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <label className="form-label">Certifications</label>
                      <input
                        className="form-input"
                        placeholder="ACE, Yoga Alliance, Nutrition Coach"
                        value={trainerForm.certifications}
                        onChange={setTrainer("certifications")}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 18 }}>
                      <label className="form-label">Health Goal</label>
                      <div className={styles.goalGrid}>
                        {GOALS.map(({ value, emoji, label }) => (
                          <button
                            key={value}
                            type="button"
                            className={`${styles.goalBtn} ${goal === value ? styles.goalActive : ""}`}
                            onClick={() => setGoal(value)}
                          >
                            <span>{emoji}</span>{label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.row2}>
                      <div>
                        <label className="form-label">Full Name *</label>
                        <input className="form-input" placeholder="Your name" value={form.name} onChange={set("name")} required />
                      </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label className="form-label">I am a... *</label>
                      <div className={styles.goalGrid} style={{ gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                          { value: "female", emoji: "👩", label: "Female" },
                          { value: "male", emoji: "👨", label: "Male" },
                          { value: "other", emoji: "🧑", label: "Other" },
                          { value: "prefer_not_to_say", emoji: "🤐", label: "Prefer not to say" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`${styles.goalBtn} ${form.gender === opt.value ? styles.goalActive : ""}`}
                            onClick={() => setForm(f => ({...f, gender: opt.value}))}
                            style={{ padding: "10px", fontSize: "14px" }}
                          >
                            <span style={{ marginRight: "6px" }}>{opt.emoji}</span>{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.row2}>
                      <div>
                        <label className="form-label">Age</label>
                        <input className="form-input" type="number" placeholder="25" value={form.age} onChange={set("age")} />
                      </div>
                    </div>

                    <div className={styles.row2} style={{ marginTop: 14 }}>
                      <div>
                        <label className="form-label">Height (cm)</label>
                        <input className="form-input" type="number" placeholder="165" value={form.heightCm} onChange={set("heightCm")} />
                      </div>
                      <div>
                        <label className="form-label">Current Weight (kg)</label>
                        <input className="form-input" type="number" placeholder="65" value={form.startingWeight} onChange={set("startingWeight")} />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Password" value={form.password} onChange={set("password")} required minLength={6} />
            </div>
            {currentMode === "login" ? (
              <div style={{ marginTop: 10, textAlign: "right" }}>
                <button
                  type="button"
                  className={styles.switchLink}
                  onClick={() => setHelperText("Password reset flow is not connected yet. Use the correct portal and contact admin for reset until the recovery API is added.")}
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: 20 }}
              disabled={loading}
            >
              {loading ? "Please wait..." : currentMode === "login" ? `Sign In to ${portal}` : `Create ${portal} account`}
            </button>
          </form>

          {helperText ? <div className={styles.helper}>{helperText}</div> : null}

          {portal === "user" ? (
            <>
              <div className={styles.divider}><span>or</span></div>
              <button type="button" className="btn btn-ghost btn-full" onClick={handleDemo} disabled={loading}>
                {loading ? "Please wait..." : "Try Demo Account"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
