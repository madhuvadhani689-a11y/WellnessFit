import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import styles from "./Settings.module.css";

const playPreviewTone = () => {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return false;

  const ctx = new AudioContextCtor();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 660;
  gain.gain.value = 0.001;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  oscillator.start(now);
  oscillator.stop(now + 0.24);
  oscillator.onended = () => ctx.close();
  return true;
};

const booleanValue = (value) => String(Boolean(value));

const getInitialSettings = (user) => {
  const preferences = user?.preferences || {};
  const app = preferences.app || {};
  const notifications = preferences.notifications || {};
  const goals = preferences.goals || {};
  const nutrition = preferences.nutrition || {};
  const privacy = preferences.privacy || {};

  return {
    name: user?.name || "",
    whatsappNumber: user?.whatsappNumber || "",
    goal: user?.goal || "loss",
    gender: user?.gender || "prefer_not_to_say",
    age: user?.age ?? "",
    heightCm: user?.heightCm ?? "",
    targetWeight: user?.targetWeight ?? "",
    activityLevel: user?.activityLevel || "moderate",
    specialization: user?.trainerProfile?.specialization || "",
    experienceYears: user?.trainerProfile?.experienceYears ?? "",
    certifications: user?.trainerProfile?.certifications || "",
    clientCapacity: user?.trainerProfile?.clientCapacity ?? "",
    theme: app.theme || "garden",
    language: app.language || "en",
    weightUnit: app.weightUnit || "kg",
    heightUnit: app.heightUnit || "cm",
    soundEnabled: app.soundEnabled !== false,
    ambientMode: app.ambientMode || "soft",
    workoutReminder: notifications.workoutEnabled === true,
    workoutReminderTime: notifications.workoutTime || "18:00",
    mealReminder: notifications.mealEnabled === true,
    mealReminderTime: notifications.mealTime || "13:00",
    waterReminder: notifications.waterEnabled !== false,
    pushNotifications: notifications.pushEnabled !== false,
    weeklySummary: notifications.weeklySummary !== false,
    periodReminderEnabled: user?.periodReminder?.enabled === true,
    periodReminderLead: String(user?.periodReminder?.leadDays?.[0] ?? 1),
    weeklyWeightGoalKg: goals.weeklyWeightGoalKg ?? 0.5,
    dailyStepGoal: goals.dailyStepGoal ?? 8000,
    calorieGoal: goals.calorieGoal ?? 1800,
    dietType: nutrition.dietType || "balanced",
    allergies: nutrition.allergies || "",
    waterGoalLiters: nutrition.waterGoalLiters ?? 2.5,
    dataSharing: privacy.dataSharing === true,
    twoFactorEnabled: privacy.twoFactorEnabled === true,
  };
};

const Section = ({ title, icon, children }) => (
  <section className={styles.sectionCard}>
    <div className={styles.sectionHeader}>
      <h2>{icon} {title}</h2>
    </div>
    {children}
  </section>
);

export default function Settings({ onNavigate, onLogout }) {
  const { user, apiFetch, login, token } = useAuth();
  const isTrainer = user?.role === "trainer";
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState(() => getInitialSettings(user));
  const [status, setStatus] = useState("");
  const [trainerCode, setTrainerCode] = useState("");

  useEffect(() => {
    setForm(getInitialSettings(user));
  }, [user]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setStatus("");
    try {
      const payload = {
        name: form.name,
        whatsappNumber: form.whatsappNumber,
        goal: isTrainer || isAdmin ? undefined : form.goal,
        gender: isTrainer || isAdmin ? undefined : form.gender,
        age: isTrainer || isAdmin || form.age === "" ? undefined : Number(form.age),
        heightCm: isTrainer || isAdmin || form.heightCm === "" ? undefined : Number(form.heightCm),
        targetWeight: isTrainer || isAdmin || form.targetWeight === "" ? undefined : Number(form.targetWeight),
        activityLevel: isTrainer || isAdmin ? undefined : form.activityLevel,
        preferences: {
          app: {
            theme: form.theme,
            language: form.language,
            weightUnit: form.weightUnit,
            heightUnit: form.heightUnit,
            soundEnabled: form.soundEnabled,
            ambientMode: form.ambientMode,
          },
          notifications: {
            workoutEnabled: form.workoutReminder,
            workoutTime: form.workoutReminderTime,
            mealEnabled: form.mealReminder,
            mealTime: form.mealReminderTime,
            waterEnabled: form.waterReminder,
            pushEnabled: form.pushNotifications,
            weeklySummary: form.weeklySummary,
          },
          goals: {
            weeklyWeightGoalKg: Number(form.weeklyWeightGoalKg),
            dailyStepGoal: Number(form.dailyStepGoal),
            calorieGoal: Number(form.calorieGoal),
          },
          nutrition: {
            dietType: form.dietType,
            allergies: form.allergies,
            waterGoalLiters: Number(form.waterGoalLiters),
          },
          privacy: {
            dataSharing: form.dataSharing,
            twoFactorEnabled: form.twoFactorEnabled,
          },
        },
        periodReminder: {
          enabled: form.periodReminderEnabled,
          leadDays: [Number(form.periodReminderLead)],
        },
        trainerProfile: isTrainer
          ? {
              specialization: form.specialization,
              experienceYears: form.experienceYears,
              certifications: form.certifications,
              clientCapacity: form.clientCapacity,
            }
          : undefined,
      };

      const data = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      document.documentElement.setAttribute("data-theme", form.theme);
      login(data.user, token);
      setStatus("Settings saved.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const connectToTrainer = async () => {
    setStatus("");
    try {
      const data = await apiFetch("/api/user/connect-trainer", {
        method: "POST",
        body: JSON.stringify({ trainerCode })
      });
      login(data.user, token);
      setStatus(data.message || "Connected to trainer successfully!");
      setTrainerCode("");
    } catch (err) {
      setStatus(err.message || "Failed to connect to trainer.");
    }
  };

  const toggleEmailNotifications = async (e) => {
    const newValue = e.target.value === "true";
    updateField("emailNotifications", newValue);
    try {
      await apiFetch("/api/users/update-profile", {
        method: "PATCH",
        body: JSON.stringify({ emailNotifications: newValue })
      });
      setStatus("Email notifications updated.");
    } catch (err) {
      setStatus(err.message || "Failed to update email notifications.");
    }
  };

  const previewSound = () => {
    if (!form.soundEnabled) {
      setStatus("Enable sound first to preview it.");
      return;
    }
    const played = playPreviewTone();
    setStatus(played ? "Sound preview played." : "Sound preview is not supported in this browser.");
  };

  return (
    <div className={styles.layout}>
      <Sidebar active="settings" onNavigate={onNavigate} onLogout={onLogout} />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Settings</h1>

        <Section title="Profile" icon="👤">
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Name</span>
              <input className={styles.inputField} value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input className={styles.inputField} value={user?.email || ""} disabled />
            </label>
            {!isTrainer && !isAdmin && (
              <label className={styles.field}>
                <span>Gender</span>
                <select className={styles.selectField} value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
            )}
            <label className={styles.field}>
              <span>WhatsApp</span>
              <input
                className={styles.inputField}
                placeholder="+91 98765 43210"
                value={form.whatsappNumber}
                onChange={(e) => updateField("whatsappNumber", e.target.value)}
              />
            </label>
            {!isTrainer && !isAdmin ? (
              <label className={styles.field}>
                <span>Gender</span>
                <select className={styles.inputField} value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
            ) : null}
          </div>

          {!isTrainer && !isAdmin ? (
            <div className={`${styles.fieldGrid} ${styles.mt16}`}>
              <label className={styles.field}>
                <span>Fitness Goal</span>
                <select className={styles.inputField} value={form.goal} onChange={(e) => updateField("goal", e.target.value)}>
                  <option value="loss">Weight Loss</option>
                  <option value="gain">Weight Gain</option>
                  <option value="pcod">PCOD Care</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Age</span>
                <input className={styles.inputField} type="number" min="10" max="100" value={form.age} onChange={(e) => updateField("age", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Height (cm)</span>
                <input className={styles.inputField} type="number" min="100" max="230" value={form.heightCm} onChange={(e) => updateField("heightCm", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Activity Level</span>
                <select className={styles.inputField} value={form.activityLevel} onChange={(e) => updateField("activityLevel", e.target.value)}>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </label>
            </div>
          ) : null}

          {isTrainer ? (
            <div className={`${styles.fieldGrid} ${styles.mt16}`}>
              <label className={styles.field}>
                <span>Specialization</span>
                <input className={styles.inputField} value={form.specialization} onChange={(e) => updateField("specialization", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Experience (years)</span>
                <input className={styles.inputField} type="number" min="0" value={form.experienceYears} onChange={(e) => updateField("experienceYears", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Certifications</span>
                <input className={styles.inputField} value={form.certifications} onChange={(e) => updateField("certifications", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Client Capacity</span>
                <input className={styles.inputField} type="number" min="0" value={form.clientCapacity} onChange={(e) => updateField("clientCapacity", e.target.value)} />
              </label>
            </div>
          ) : null}
        </Section>

        {!isTrainer && !isAdmin ? (
          <Section title="Goals" icon="🎯">
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Target Weight</span>
                <input className={styles.inputField} type="number" min="30" max="250" value={form.targetWeight} onChange={(e) => updateField("targetWeight", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Weekly Weight Goal (kg)</span>
                <input className={styles.inputField} type="number" min="0.1" max="2" step="0.1" value={form.weeklyWeightGoalKg} onChange={(e) => updateField("weeklyWeightGoalKg", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Daily Step Goal</span>
                <input className={styles.inputField} type="number" min="1000" max="50000" step="500" value={form.dailyStepGoal} onChange={(e) => updateField("dailyStepGoal", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Calorie Goal</span>
                <input className={styles.inputField} type="number" min="800" max="5000" step="50" value={form.calorieGoal} onChange={(e) => updateField("calorieGoal", e.target.value)} />
              </label>
            </div>
          </Section>
        ) : null}

        {!isTrainer && !isAdmin ? (
          <Section title="Nutrition" icon="🥗">
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Diet Type</span>
                <select className={styles.inputField} value={form.dietType} onChange={(e) => updateField("dietType", e.target.value)}>
                  <option value="balanced">Balanced</option>
                  <option value="veg">Veg</option>
                  <option value="non_veg">Non-veg</option>
                  <option value="vegan">Vegan</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Water Goal (liters)</span>
                <input className={styles.inputField} type="number" min="1" max="6" step="0.1" value={form.waterGoalLiters} onChange={(e) => updateField("waterGoalLiters", e.target.value)} />
              </label>
              <label className={`${styles.field} ${styles.span2}`}>
                <span>Allergies / Restrictions</span>
                <input className={styles.inputField} placeholder="Nuts, dairy, soy..." value={form.allergies} onChange={(e) => updateField("allergies", e.target.value)} />
              </label>
            </div>
          </Section>
        ) : null}

        <Section title="Reminders" icon="🔔">
          <div className={styles.reminderRow}>
            <div className={styles.reminderInfo}>
              <span>Workout Reminder</span>
            </div>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={form.workoutReminder} onChange={(e) => updateField("workoutReminder", e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
          </div>
          {form.workoutReminder && (
            <label className={`${styles.field} ${styles.mb16}`}>
              <span>Workout Time</span>
              <input className={styles.inputField} type="time" value={form.workoutReminderTime} onChange={(e) => updateField("workoutReminderTime", e.target.value)} />
            </label>
          )}

          <div className={styles.reminderRow}>
            <div className={styles.reminderInfo}>
              <span>Meal Reminder</span>
            </div>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={form.mealReminder} onChange={(e) => updateField("mealReminder", e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
          </div>
          {form.mealReminder && (
            <label className={`${styles.field} ${styles.mb16}`}>
              <span>Meal Time</span>
              <input className={styles.inputField} type="time" value={form.mealReminderTime} onChange={(e) => updateField("mealReminderTime", e.target.value)} />
            </label>
          )}

          <div className={styles.reminderRow}>
            <div className={styles.reminderInfo}>
              <span>Water Reminder</span>
            </div>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={form.waterReminder} onChange={(e) => updateField("waterReminder", e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.reminderRow}>
            <div className={styles.reminderInfo}>
              <span>Push Notifications</span>
            </div>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={form.pushNotifications} onChange={(e) => updateField("pushNotifications", e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.reminderRow}>
            <div className={styles.reminderInfo}>
              <span>Weekly Summary</span>
            </div>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={form.weeklySummary} onChange={(e) => updateField("weeklySummary", e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
          </div>

          {!isTrainer && !isAdmin ? (
            <div className={`${styles.reminderRow} ${form.periodReminderEnabled ? "" : styles.mb16}`}>
              <div className={styles.reminderInfo}>
                <span>Period Reminder</span>
                <button
                  className={styles.smallOutlineBtn}
                  onClick={() => updateField("periodReminderEnabled", !form.periodReminderEnabled)}
                  style={{ marginLeft: 12 }}
                >
                  {form.periodReminderEnabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ) : null}
          {!isTrainer && !isAdmin && form.periodReminderEnabled && (
            <label className={`${styles.field} ${styles.mb16}`}>
              <span>Period Reminder Lead Days</span>
              <select className={styles.inputField} value={form.periodReminderLead} onChange={(e) => updateField("periodReminderLead", e.target.value)}>
                <option value="0">On day</option>
                <option value="1">1 day before</option>
                <option value="2">2 days before</option>
                <option value="3">3 days before</option>
                <option value="5">5 days before</option>
              </select>
            </label>
          )}
        </Section>

        <Section title="App Preferences" icon="⚙️">
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Theme</span>
              <select
                className={styles.inputField}
                value={form.theme}
                onChange={(e) => {
                  updateField("theme", e.target.value);
                  document.documentElement.setAttribute("data-theme", e.target.value);
                }}
              >
                <option value="garden">Garden</option>
                <option value="sunrise">Sunrise</option>
                <option value="midnight">Midnight</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Language</span>
              <select className={styles.inputField} value={form.language} onChange={(e) => updateField("language", e.target.value)}>
                <option value="en">English</option>
                <option value="ta">Tamil</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Weight Unit</span>
              <select className={styles.inputField} value={form.weightUnit} onChange={(e) => updateField("weightUnit", e.target.value)}>
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Height Unit</span>
              <select className={styles.inputField} value={form.heightUnit} onChange={(e) => updateField("heightUnit", e.target.value)}>
                <option value="cm">cm</option>
                <option value="ft">ft</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Sound Style</span>
              <select className={styles.inputField} value={form.ambientMode} onChange={(e) => updateField("ambientMode", e.target.value)}>
                <option value="soft">Soft</option>
                <option value="bright">Bright</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
            
            <div className={styles.soundRow}>
              <label className={styles.field} style={{ flex: 1 }}>
                <span>Sound</span>
                <select className={styles.inputField} value={booleanValue(form.soundEnabled)} onChange={(e) => updateField("soundEnabled", e.target.value === "true")}>
                  <option value="true">Enabled</option>
                  <option value="false">Muted</option>
                </select>
              </label>
              <button className={styles.iconButton} onClick={previewSound} title="Preview UI Sound">
                🔊
              </button>
            </div>
          </div>
        </Section>

        {!isTrainer && !isAdmin ? (
          <Section title="Connect to Trainer" icon="🤝">
            <div className={styles.fieldGrid}>
              <label className={`${styles.field} ${styles.span2}`}>
                <span>Trainer Code</span>
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <input
                    className={styles.inputField}
                    placeholder="Enter 6-character code"
                    value={trainerCode}
                    onChange={(e) => setTrainerCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <button className={styles.saveBtn} style={{ margin: 0, padding: "0 24px", width: "auto" }} onClick={connectToTrainer} disabled={!trainerCode || trainerCode.length !== 6}>Connect</button>
                </div>
                {user?.assignedTrainer && (
                  <p style={{ marginTop: "12px", fontSize: "14px", color: "var(--accent-green)" }}>
                    ✓ You are connected to a trainer. Entering a new code will switch your trainer.
                  </p>
                )}
              </label>
            </div>
          </Section>
        ) : null}

        <Section title="Privacy & Support" icon="🔒">
          <div className={styles.fieldGrid}>
            <label className={`${styles.field} ${styles.span2}`}>
              <span>📧 Email Notifications</span>
              <select className={styles.inputField} value={booleanValue(form.emailNotifications)} onChange={toggleEmailNotifications}>
                <option value="true">On</option>
                <option value="false">Off</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Data Sharing</span>
              <select className={styles.inputField} value={booleanValue(form.dataSharing)} onChange={(e) => updateField("dataSharing", e.target.value === "true")}>
                <option value="false">Private</option>
                <option value="true">Share anonymized insights</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Two-factor Authentication</span>
              <select className={styles.inputField} value={booleanValue(form.twoFactorEnabled)} onChange={(e) => updateField("twoFactorEnabled", e.target.value === "true")}>
                <option value="false">Off</option>
                <option value="true">On</option>
              </select>
            </label>
          </div>
          <button className={styles.redOutlineBtn} onClick={onLogout}>
            Log Out
          </button>
        </Section>

      </main>
      
      <div className={styles.footerBar}>
        <button className={styles.saveBtn} onClick={save}>Save Settings</button>
        {status ? <span className={styles.status}>{status}</span> : null}
      </div>
    </div>
  );
}
