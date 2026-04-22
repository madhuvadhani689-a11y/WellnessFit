import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import FoodSymptomCorrelation from "../components/FoodSymptomCorrelation";
import WellnessInsights from "../components/WellnessInsights";
import styles from "./PCODTracker.module.css";

const SYMPTOMS = [
  ["\u{1F623}", "Cramps"], ["\u{1FAE0}", "Bloating"], ["\u{1F629}", "Fatigue"],
  ["\u{1F622}", "Mood Swings"], ["\u{1F92F}", "Headache"], ["\u{1F624}", "Acne"],
  ["\u{1F634}", "Insomnia"], ["\u{1F922}", "Nausea"], ["\u{1F494}", "Back Pain"],
];

const MOODS = ["\u{1F61E}", "\u{1F610}", "\u{1F642}", "\u{1F60A}", "\u{1F604}"];
const REMINDER_OPTIONS = [7, 5, 3, 1, 0];

const CAL_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const date = startOfDay(value);
  date.setDate(date.getDate() + days);
  return date;
};

const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

const formatDateLabel = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const computeCycleInfoFromLogs = (logs = []) => {
  const periodLogs = logs
    .filter((log) => log.periodStartDate)
    .sort((a, b) => new Date(b.periodStartDate) - new Date(a.periodStartDate));

  if (!periodLogs.length) {
    return { cycleDay: 1, phase: "Unknown", avgCycle: 28, nextPeriod: null };
  }

  const lastStart = startOfDay(periodLogs[0].periodStartDate);
  const lastEnd = periodLogs[0].periodEndDate ? startOfDay(periodLogs[0].periodEndDate) : null;
  const today = startOfDay(new Date());
  const daysSince = Math.floor((today - lastStart) / 864e5);

  let avgCycle = 28;
  if (periodLogs.length > 1) {
    const diffs = periodLogs
      .slice(0, -1)
      .map((log, i) => (new Date(log.periodStartDate) - new Date(periodLogs[i + 1].periodStartDate)) / 864e5)
      .filter((value) => value >= 20 && value <= 45);
    if (diffs.length) {
      avgCycle = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
  }

  const reminderBase = lastEnd || lastStart;
  let nextPeriod = new Date(reminderBase.getTime() + avgCycle * 864e5);
  while (startOfDay(nextPeriod) <= today) {
    nextPeriod = new Date(nextPeriod.getTime() + avgCycle * 864e5);
  }

  const projectedCycleDay = ((daysSince % avgCycle) + avgCycle) % avgCycle + 1;
  const phase =
    projectedCycleDay <= 5 ? "Menstrual" :
    projectedCycleDay <= 11 ? "Follicular" :
    projectedCycleDay <= 14 ? "Ovulatory" : "Luteal";

  return { cycleDay: projectedCycleDay, phase, avgCycle, nextPeriod };
};

const buildCalendarDays = ({ cycleInfo, recentLogs }) => {
  const today = startOfDay(new Date());
  const fallbackLastStart = addDays(today, -((cycleInfo?.cycleDay || 1) - 1));

  const periodStarts = (recentLogs || [])
    .filter((log) => log.periodStartDate)
    .map((log) => startOfDay(log.periodStartDate))
    .sort((a, b) => b - a);

  const lastStart = periodStarts[0] || fallbackLastStart;
  const avgCycle = cycleInfo?.avgCycle || 28;
  const nextPeriod = cycleInfo?.nextPeriod ? startOfDay(cycleInfo.nextPeriod) : addDays(lastStart, avgCycle);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const leading = monthStart.getDay();

  const periodDays = new Set();
  const fertileDays = new Set();
  const ovulationDays = new Set();

  for (let i = 0; i < 5; i += 1) {
    periodDays.add(addDays(lastStart, i).getTime());
    periodDays.add(addDays(nextPeriod, i).getTime());
  }

  const ovulationDate = addDays(nextPeriod, -14);
  for (let i = -2; i <= 2; i += 1) {
    fertileDays.add(addDays(ovulationDate, i).getTime());
  }
  ovulationDays.add(ovulationDate.getTime());

  const days = [];
  for (let i = 0; i < leading; i += 1) {
    days.push({ key: `blank-${i}`, blank: true });
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    const current = new Date(today.getFullYear(), today.getMonth(), day);
    const time = startOfDay(current).getTime();
    let type = "";
    if (periodDays.has(time)) type = "period";
    else if (ovulationDays.has(time)) type = "ovulation";
    else if (fertileDays.has(time)) type = "fertile";

    days.push({
      key: `day-${day}`,
      blank: false,
      day,
      type,
      isToday: sameDay(current, today),
    });
  }

  return {
    monthTitle: today.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    days,
    nextPeriod,
    ovulationDate,
  };
};

const CycleWheel = ({ cycleDay, phase, avgCycle }) => {
  const r = 90;
  const c = 2 * Math.PI * r; 
  const cx = 120;
  const cy = 120;

  const totalDays = avgCycle > 0 ? avgCycle : 28;
  
  const mF = 5 / 28;
  const fF = 8 / 28;
  const oF = 1 / 28;
  const lF = 14 / 28;

  const mDash = mF * c;
  const fDash = fF * c;
  const oDash = oF * c;
  const lDash = lF * c;

  const frac = (cycleDay - 0.5) / totalDays;
  const angle = frac * 2 * Math.PI - Math.PI / 2;
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy + r * Math.sin(angle);

  return (
    <div className={styles.wheelContainer}>
      <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto" }}>
        <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c3b1e1" strokeWidth="14" strokeDasharray={`${lDash} ${c}`} strokeDashoffset={-(mDash + fDash + oDash)} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f5d67a" strokeWidth="14" strokeDasharray={`${oDash} ${c}`} strokeDashoffset={-(mDash + fDash)} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#a8c5a0" strokeWidth="14" strokeDasharray={`${fDash} ${c}`} strokeDashoffset={-mDash} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f4b8c1" strokeWidth="14" strokeDasharray={`${mDash} ${c}`} strokeDashoffset="0" />
        </svg>
        <div style={{
            position: "absolute", left: dotX, top: dotY, width: 14, height: 14,
            background: "#fff", border: "3px solid #3d5a3e", borderRadius: "50%",
            transform: "translate(-50%, -50%)", boxShadow: "0 0 10px rgba(61, 90, 62, 0.4)"
        }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: "3rem", fontWeight: "800", color: "#3d5a3e", lineHeight: 1 }}>{cycleDay}</div>
          <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#666", marginTop: 4 }}>{phase}</div>
        </div>
      </div>
    </div>
  )
};

export default function PCODTracker({ onNavigate, onBack, onLogout }) {
  const { apiFetch, buildScopedKey, user, token } = useAuth();
  const [activeSyms, setActiveSyms] = useState(new Set());
  const [mood, setMood] = useState(2);
  const [pain, setPain] = useState(2);
  const [cycleInfo, setCycleInfo] = useState({ cycleDay: 1, phase: "Unknown", avgCycle: 28, nextPeriod: null });
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [recentLogs, setRecentLogs] = useState([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [periodReminderEnabled, setPeriodReminderEnabled] = useState(
    false
  );
  const [periodReminderLeadDays, setPeriodReminderLeadDays] = useState(
    [5, 3, 1]
  );
  const [notifyPermission, setNotifyPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [toast, setToast] = useState("");
  const pcodLogsKey = buildScopedKey("wf_pcod_logs");
  const pcodReminderKey = buildScopedKey("wf_pcod_reminder");
  const pcodReminderSentKey = buildScopedKey("wf_pcod_reminder_last_sent");

  const showFeedback = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    }
  };

  const applyLocalState = () => {
    const localLogs = readJson(pcodLogsKey, []);
    const localReminder = readJson(pcodReminderKey, {
      enabled: false,
      leadDays: [5, 3, 1],
    });
    setRecentLogs(localLogs);
    setCycleInfo(computeCycleInfoFromLogs(localLogs));
    setPeriodReminderEnabled(Boolean(localReminder.enabled));
    setPeriodReminderLeadDays(Array.isArray(localReminder.leadDays) ? localReminder.leadDays : [5, 3, 1]);
    setActiveSyms(new Set());
    setMood(2);
    setPain(2);
    setNotes("");
    setPeriodStartDate("");
    setPeriodEndDate("");

    const latest = localLogs[0];
    if (latest) {
      setMood(typeof latest.mood === "number" ? latest.mood : 2);
      setPain(typeof latest.painLevel === "number" ? latest.painLevel : 2);
      setNotes(latest.notes || "");
      setPeriodStartDate(latest.periodStartDate ? new Date(latest.periodStartDate).toISOString().slice(0, 10) : "");
      setPeriodEndDate(latest.periodEndDate ? new Date(latest.periodEndDate).toISOString().slice(0, 10) : "");
      const selected = (latest.symptoms || [])
        .map((s) => SYMPTOMS.findIndex((x) => x[1] === s.name))
        .filter((idx) => idx >= 0);
      if (selected.length) setActiveSyms(new Set(selected));
    }
  };

  useEffect(() => {
    apiFetch("/api/pcod")
      .then((d) => {
        if (d.cycleInfo) setCycleInfo(d.cycleInfo);
        if (d.reminder) {
          setPeriodReminderEnabled(Boolean(d.reminder.enabled));
          setPeriodReminderLeadDays(Array.isArray(d.reminder.leadDays) ? d.reminder.leadDays : [5, 3, 1]);
        }
        if (Array.isArray(d.logs)) {
          setRecentLogs(d.logs);
          const latest = d.logs[0];
          if (latest) {
            setMood(typeof latest.mood === "number" ? latest.mood : 2);
            setPain(typeof latest.painLevel === "number" ? latest.painLevel : 2);
            setNotes(latest.notes || "");
            setPeriodStartDate(latest.periodStartDate ? new Date(latest.periodStartDate).toISOString().slice(0, 10) : "");
            setPeriodEndDate(latest.periodEndDate ? new Date(latest.periodEndDate).toISOString().slice(0, 10) : "");
            const selected = (latest.symptoms || [])
              .map((s) => SYMPTOMS.findIndex((x) => x[1] === s.name))
              .filter((idx) => idx >= 0);
            if (selected.length) setActiveSyms(new Set(selected));
          }
        }
      })
      .catch(() => {
        applyLocalState();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFetch, user?._id]);

  useEffect(() => {
    const getNextPeriodDate = () => {
      if (cycleInfo?.nextPeriod) {
        const parsed = new Date(cycleInfo.nextPeriod);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
      if (typeof cycleInfo?.avgCycle === "number" && typeof cycleInfo?.cycleDay === "number") {
        const remaining = Math.max(0, cycleInfo.avgCycle - cycleInfo.cycleDay);
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + remaining);
        return d;
      }
      return null;
    };

    const timer = setInterval(() => {
      if (!periodReminderEnabled || notifyPermission !== "granted") return;

      const nextPeriodDate = getNextPeriodDate();
      if (!nextPeriodDate) return;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(nextPeriodDate.getFullYear(), nextPeriodDate.getMonth(), nextPeriodDate.getDate());
      const daysDiff = Math.floor((target - today) / 864e5);
      const reminderKey = `${today.toISOString().slice(0, 10)}-${daysDiff}`;
      const sentKey = sessionStorage.getItem(pcodReminderSentKey);

      if (periodReminderLeadDays.includes(daysDiff) && sentKey !== reminderKey) {
        const when = daysDiff === 0 ? "today" : `in ${daysDiff} day${daysDiff > 1 ? "s" : ""}`;
        new Notification("Period Reminder", {
          body: `Your predicted cycle is expected ${when}. Plan meals, hydration, and rest.`,
        });
        sessionStorage.setItem(pcodReminderSentKey, reminderKey);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [cycleInfo, periodReminderEnabled, periodReminderLeadDays, notifyPermission, pcodReminderSentKey]);

  const toggleSym = (i) => {
    setActiveSyms((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleLog = async () => {
    const body = {
      symptoms: [...activeSyms].map((i) => ({ name: SYMPTOMS[i][1], severity: 5 })),
      mood,
      painLevel: pain,
      periodStartDate: periodStartDate || undefined,
      periodEndDate: periodEndDate || undefined,
      notes,
    };
    try {
      await apiFetch("/api/pcod", { method: "POST", body: JSON.stringify(body) });
      const refreshed = await apiFetch("/api/pcod");
      if (refreshed.cycleInfo) setCycleInfo(refreshed.cycleInfo);
      if (Array.isArray(refreshed.logs)) setRecentLogs(refreshed.logs);
      writeJson(pcodLogsKey, refreshed.logs || []);
    } catch {
      const localLogs = readJson(pcodLogsKey, []);
      const todayKey = new Date().toISOString().slice(0, 10);
      const nextLog = {
        ...body,
        loggedAt: new Date().toISOString(),
      };
      const updatedLogs = [
        nextLog,
        ...localLogs.filter((item) => String(item.loggedAt || "").slice(0, 10) !== todayKey),
      ].slice(0, 90);
      writeJson(pcodLogsKey, updatedLogs);
      setRecentLogs(updatedLogs);
      setCycleInfo(computeCycleInfoFromLogs(updatedLogs));
      showFeedback("Saved locally. Backend is unavailable right now.");
      return;
    }
    showFeedback("Symptoms logged successfully.");
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") {
      setToast("Notifications are not supported in this browser.");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    const res = await Notification.requestPermission();
    setNotifyPermission(res);
    setToast(res === "granted" ? "Period reminders enabled." : "Notification permission denied.");
    setTimeout(() => setToast(""), 2500);
  };

  const saveReminderSettings = async (nextEnabled, nextLeadDays) => {
    try {
      const data = await apiFetch("/api/pcod/reminder", {
        method: "PUT",
        body: JSON.stringify({
          enabled: nextEnabled,
          leadDays: nextLeadDays,
          channels: { email: true, whatsapp: true },
        }),
      });
      const reminder = data?.reminder || {};
      setPeriodReminderEnabled(Boolean(reminder.enabled));
      setPeriodReminderLeadDays(Array.isArray(reminder.leadDays) ? reminder.leadDays : [5, 3, 1]);
      showFeedback("Reminder settings saved.");
    } catch (err) {
      const fallbackReminder = {
        enabled: nextEnabled,
        leadDays: nextLeadDays.length ? nextLeadDays : [5, 3, 1],
      };
      writeJson(pcodReminderKey, fallbackReminder);
      setPeriodReminderEnabled(fallbackReminder.enabled);
      setPeriodReminderLeadDays(fallbackReminder.leadDays);
      showFeedback(err.message ? `${err.message} Saved locally instead.` : "Saved locally. Backend is unavailable.");
    }
  };

  const toggleLeadDay = (day) => {
    setPeriodReminderLeadDays((prev) =>
      prev.includes(day)
        ? prev.filter((value) => value !== day)
        : [...prev, day].sort((a, b) => b - a)
    );
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await window.fetch(`${API_URL}/api/pcod/export-report`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "WellnessSummary.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showFeedback("Your wellness summary downloaded! 🌿");
    } catch {
      showFeedback("Could not generate summary. Try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const hormones = [
    { name: "Estrogen", value: 72, color: "#7C9A7E", status: "Normal", tip: "Controls energy & mood" },
    { name: "Progesterone", value: 45, color: "#E8B4A0", status: "Slightly Low", tip: "Affects sleep & calm" },
    { name: "LH", value: 85, color: "#C9A84C", status: "Elevated", tip: "Triggers ovulation" },
    { name: "FSH", value: 60, color: "#7C9A7E", status: "Normal", tip: "Stimulates egg growth" },
    { name: "Testosterone", value: 68, color: "#8B5E3C", status: "Slightly High", tip: "Impacts energy & cycles" },
  ];

  const trend = recentLogs.slice(0, 7);
  const avgMood = trend.length ? (trend.reduce((acc, item) => acc + (item.mood ?? 0), 0) / trend.length).toFixed(1) : "0.0";
  const avgPain = trend.length ? (trend.reduce((acc, item) => acc + (item.painLevel ?? 0), 0) / trend.length).toFixed(1) : "0.0";
  const calendar = buildCalendarDays({ cycleInfo, recentLogs });
  const nextPeriodText = calendar.nextPeriod ? formatDateLabel(calendar.nextPeriod) : "Not enough data";
  const daysUntilNext = calendar.nextPeriod ? Math.max(0, Math.round((startOfDay(calendar.nextPeriod) - startOfDay(new Date())) / 864e5)) : null;

  return (
    <div className={styles.layout}>
      <Sidebar active="pcod" onNavigate={onNavigate} onLogout={onLogout} />

      <main className={styles.main}>
        <div className="page-header">
          <button className="back-btn" onClick={onBack}>Back to Dashboard</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
            <div>
              <h1>PCOD Tracker</h1>
              <p>Track your cycle, symptoms, and hormonal health</p>
            </div>
            <button 
              type="button" 
              className={`btn ${downloadingPdf ? "btn-disabled" : "btn-primary"}`} 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              style={{ padding: "0 24px", height: "42px" }}
            >
              {downloadingPdf ? "Generating..." : "📊 Download My Summary"}
            </button>
          </div>
        </div>

        {toast ? <div className={styles.inlineToast}>{toast}</div> : null}
        <div className={styles.topActionRow}>
          <button type="button" className={`btn btn-primary ${styles.topSaveBtn}`} onClick={handleLog}>
            Save Today&apos;s Log
          </button>
        </div>

        <CycleWheel cycleDay={cycleInfo.cycleDay} phase={cycleInfo.phase} avgCycle={cycleInfo.avgCycle} />
        <div className={styles.pillContainer}>
          <div className={styles.pillStat}>📅 Day {cycleInfo.cycleDay}</div>
          <div className={styles.pillStat}>🌿 {cycleInfo.phase} Phase</div>
          <div className={styles.pillStat}>⏳ {daysUntilNext != null ? `Next in ${daysUntilNext} day${daysUntilNext === 1 ? "" : "s"}` : "Need logs to predict"}</div>
        </div>

        <div className="grid-2">

          <div className="card">
            <div className="card-title">Hormone Levels</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {hormones.map((hormone) => (
                <div key={hormone.name} title={hormone.tip}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: ".84rem", fontWeight: 600 }}>
                      {hormone.label || hormone.name || "Testosterone"}
                    </span>
                    <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                      {hormone.status ?? "Normal"} ({hormone.value}%)
                    </span>
                  </div>
                  <div className="bar-wrap"><div className="bar-fill" style={{ width: `${hormone.value}%`, background: hormone.color }} /></div>
                </div>
              ))}
            </div>
          </div>

          <WellnessInsights cycleDay={cycleInfo.cycleDay} />
        </div>

        <div className="grid-2">
          <div className="card" style={{ height: "auto", overflow: "hidden" }}>
            <div className="card-title">Cycle Calendar - {calendar.monthTitle}</div>
            <div className={styles.calGrid}>
              {CAL_LABELS.map((d) => (
                <div key={d} className={styles.calLabel}>{d}</div>
              ))}
              {calendar.days.map((item) =>
                item.blank ? (
                  <div key={item.key} />
                ) : (
                  <div
                    key={item.key}
                    className={`${styles.calDay} ${styles[item.type] || ""} ${item.isToday ? styles.today : ""}`}
                  >
                    {item.day}
                  </div>
                )
              )}
            </div>
            <div className={styles.legend}>
              {[["rgba(232,180,160,.5)", "Period"], ["rgba(201,168,76,.25)", "Fertile"], ["rgba(124,154,126,.4)", "Ovulation"]].map(([bg, lbl]) => (
                <div key={lbl} className={styles.legendItem}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: bg }} />
                  <span>{lbl}</span>
                </div>
              ))}
            </div>
            <div className={styles.calendarMeta}>
              <div>Predicted ovulation: {formatDateLabel(calendar.ovulationDate)}</div>
              <div>Predicted next period: {nextPeriodText}</div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1.5px dashed rgba(124,154,126,0.2)" }}>
              <div style={{ fontSize: ".76rem", fontWeight: 700, marginBottom: 10, color: "var(--charcoal)" }}>7-Day Trend</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ background: "#f0ede6", padding: "6px 12px", borderRadius: "999px", fontSize: ".75rem", fontWeight: 600, color: "#444" }}>📋 Logs: {trend.length}</div>
                <div style={{ background: "#f0ede6", padding: "6px 12px", borderRadius: "999px", fontSize: ".75rem", fontWeight: 600, color: "#444" }}>😊 Avg Mood: {avgMood}/4</div>
                <div style={{ background: "#f0ede6", padding: "6px 12px", borderRadius: "999px", fontSize: ".75rem", fontWeight: 600, color: "#444" }}>😣 Avg Pain: {avgPain}/9</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Log Today&apos;s Symptoms</div>
            <div style={{ fontSize: ".76rem", color: "var(--muted)", marginBottom: 12 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>

            <div style={{ fontSize: ".76rem", fontWeight: 700, marginBottom: 8 }}>Symptoms</div>
            <div className={styles.symGrid}>
              {SYMPTOMS.map(([icon, name], i) => (
                <button
                  type="button"
                  key={name}
                  className={`${styles.symBtnCircle} ${activeSyms.has(i) ? styles.symOnCircle : ""}`}
                  onClick={() => toggleSym(i)}
                  title={name}
                >
                  <span style={{ fontSize: "32px", lineHeight: 1 }}>{icon}</span>
                  <span className={styles.symLabelText}>{name}</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize: ".76rem", fontWeight: 700, margin: "14px 0 8px" }}>Mood Today</div>
            <div style={{ display: "flex", gap: 8 }}>
              {MOODS.map((m, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setMood(i)}
                  style={{
                    flex: 1,
                    padding: "9px 4px",
                    border: `1.5px solid ${mood === i ? "var(--sage)" : "rgba(124,154,126,.15)"}`,
                    borderRadius: "var(--radius-sm)",
                    background: mood === i ? "rgba(124,154,126,.1)" : "var(--white)",
                    fontSize: "1.3rem",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    transform: mood === i ? "scale(1.12)" : "scale(1)"
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <div style={{ fontSize: ".76rem", fontWeight: 700, margin: "14px 0 8px" }}>Pain Level (0 - 9)</div>
            <div style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setPain(i)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `1.5px solid ${pain === i ? "var(--green)" : "rgba(124,154,126,.2)"}`,
                    background: pain === i ? "var(--green)" : "var(--white)",
                    color: pain === i ? "#fff" : "var(--muted)",
                    fontSize: ".76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    fontFamily: "var(--font-body)"
                  }}
                >
                  {i}
                </button>
              ))}
            </div>

            <div className={styles.inputsGrid}>
              <div>
                <label className="form-label">Period Start</label>
                <input
                  type="date"
                  className="form-input"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Period End</label>
                <input
                  type="date"
                  className="form-input"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label className="form-label">Notes</label>
              <textarea
                className={styles.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sleep, cravings, stress, or anything important today..."
              />
            </div>

            <div className={styles.reminderBox}>
              <div className={styles.reminderHeader}>
                <div className={styles.reminderHeading}>
                  <div className={styles.reminderTitle}>Cycle Reminder</div>
                  <p className={styles.reminderSub}>
                    Turn reminders on, choose reminder days, then save your cycle alert preferences.
                  </p>
                </div>
                <span className={`${styles.reminderState} ${periodReminderEnabled ? styles.reminderStateOn : ""}`}>
                  {periodReminderEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className={styles.reminderControls}>
                <button type="button" className="btn btn-ghost" onClick={enableNotifications}>
                  {notifyPermission === "granted" ? "Notifications Allowed" : "Allow Notifications"}
                </button>
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={periodReminderEnabled}
                    onChange={(e) => setPeriodReminderEnabled(e.target.checked)}
                  />
                  <span>Enable Cycle Reminder</span>
                </label>
              </div>

              <div className={styles.reminderLead}>
                <label className="form-label">Reminder Type</label>
                <div className={styles.reminderDays}>
                  <span className={`${styles.reminderDay} ${styles.reminderDayOn}`}>App Notification</span>
                </div>
              </div>
              <div className={styles.reminderLead}>
                <label className="form-label">Notify When</label>
                <div className={styles.reminderDays}>
                  {REMINDER_OPTIONS.map((day) => {
                    const active = periodReminderLeadDays.includes(day);
                    return (
                      <label key={day} className={`${styles.reminderDay} ${active ? styles.reminderDayOn : ""}`}>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleLeadDay(day)}
                          className={styles.dayCheckbox}
                        />
                        <span>{day === 0 ? "On expected day" : `${day} day${day === 1 ? "" : "s"} before`}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className={styles.reminderSaveRow}>
                <button
                  type="button"
                  className="btn btn-sage"
                  onClick={() => saveReminderSettings(periodReminderEnabled, periodReminderLeadDays)}
                >
                  Update Cycle Reminder
                </button>
              </div>
            </div>

          </div>
        </div>

        <FoodSymptomCorrelation />

      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
