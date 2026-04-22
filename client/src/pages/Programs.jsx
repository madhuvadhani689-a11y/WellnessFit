import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import styles from "./WorkoutPlanner.module.css";

const STATUS_COLORS = {
  scheduled: "var(--gold)",
  completed: "var(--sage)",
  skipped: "var(--blush)",
};

const TRAINER_TEMPLATES = [
  {
    title: "PCOD Energy Reset",
    detail: "Low-impact circuit with mobility, breath work, and 2 light cardio peaks.",
  },
  {
    title: "Strength Progression Block",
    detail: "Three lift anchors, one deload rule, and Friday review prompts.",
  },
  {
    title: "Beginner Fat-loss Circuit",
    detail: "Short sessions built for consistency and home-based equipment.",
  },
];

const TRAINER_CLIENTS = [
  { name: "Asha K", goal: "PCOD care", cadence: "Needs check-in today" },
  { name: "Nivetha R", goal: "Fat loss", cadence: "Progress review due tomorrow" },
  { name: "Divya P", goal: "Strength", cadence: "Refresh next week's program" },
];

const TRAINER_CHECKLIST = [
  "Confirm session objective before generating a program.",
  "Use notes for injuries, fatigue, or cycle-related constraints.",
  "Review the saved duration history to avoid repeating weak sessions.",
  "Mark delivered plans done after the client completes the workout.",
];

const GOAL_LIBRARY = {
  loss: {
    baseTitle: "Fat-Burn",
    short: [
      { title: "Fast Walk Activation", instructions: "Raise heart rate gradually with a brisk walk and arm drive." },
      { title: "Metabolic Circuit", instructions: "Alternate squats, step jacks, and incline pushups without long rest." },
      { title: "Core Finisher", instructions: "Use plank holds and controlled knee drives to finish strong." },
    ],
    medium: [
      { title: "Cardio Ramp-Up", instructions: "Build pace through light jogging or marching intervals." },
      { title: "Bodyweight Conditioning", instructions: "Rotate lunges, squat pulses, and pushups in timed rounds." },
      { title: "Core Burn", instructions: "Use dead bugs, mountain climbers, and side planks for trunk control." },
      { title: "Low-Impact Burnout", instructions: "Keep moving with step touch, punches, and mini squat holds." },
    ],
    long: [
      { title: "Endurance Walk / Jog", instructions: "Set a sustainable pace and hold steady breathing." },
      { title: "Lower-Body Burner", instructions: "Use lunges, squats, and glute work with short rest." },
      { title: "Upper + Core Mix", instructions: "Blend pushups, rows, and anti-rotation core work." },
      { title: "Conditioning Ladder", instructions: "Work in progressive intervals to lift effort gradually." },
      { title: "Mobility Reset", instructions: "Recover with dynamic stretches between harder phases." },
    ],
  },
  gain: {
    baseTitle: "Strength Build",
    short: [
      { title: "Activation Warm Set", instructions: "Prime joints and muscles with band-free activation." },
      { title: "Compound Strength Block", instructions: "Focus on squats, push patterns, and controlled tempo reps." },
      { title: "Accessory Finisher", instructions: "Finish with calf raises, split squats, and core bracing." },
    ],
    medium: [
      { title: "Dynamic Warmup", instructions: "Prepare hips, shoulders, and trunk before loading effort." },
      { title: "Strength Set A", instructions: "Prioritize bigger compound patterns with longer control." },
      { title: "Strength Set B", instructions: "Support the main lift with unilateral accessory work." },
      { title: "Core Stability", instructions: "Use planks and carries to reinforce posture." },
    ],
    long: [
      { title: "Mobility + Prep", instructions: "Open hips, shoulders, and ankles before the main sets." },
      { title: "Primary Strength Block", instructions: "Work on your heaviest quality movements first." },
      { title: "Secondary Volume Block", instructions: "Accumulate extra reps for balanced muscle stimulus." },
      { title: "Accessory Isolation", instructions: "Add focused work for glutes, arms, or upper back." },
      { title: "Breath-Led Stretch", instructions: "Cool down to support recovery and reduce stiffness." },
    ],
  },
  pcod: {
    baseTitle: "Hormone-Balance",
    short: [
      { title: "Gentle Cardio Start", instructions: "Use low-impact steps or cycling to ease into movement." },
      { title: "Core Stability Flow", instructions: "Prioritize pelvic stability, breathing, and posture." },
      { title: "Relaxation Finish", instructions: "End with calming stretches and long exhales." },
    ],
    medium: [
      { title: "Low-Impact Cardio", instructions: "Walk or cycle at a conversational pace." },
      { title: "Pilates Stability", instructions: "Control the tempo and focus on alignment." },
      { title: "Stress-Relief Yoga Flow", instructions: "Use smooth transitions with extended breathing." },
      { title: "Mobility Reset", instructions: "Release hips, lower back, and shoulders gently." },
    ],
    long: [
      { title: "Mobility Wake-Up", instructions: "Start with relaxed joint mobility and diaphragmatic breathing." },
      { title: "Steady Cardio Phase", instructions: "Hold a calm, sustainable low-impact rhythm." },
      { title: "Pilates + Core Control", instructions: "Build stability without spiking fatigue." },
      { title: "Yoga Recovery Flow", instructions: "Move through restorative poses with long exhale cues." },
      { title: "Relaxation Cooldown", instructions: "Lower stress load with slow stretches and stillness." },
    ],
  },
};

const ZUMBA_LIBRARY = {
  light: [
    { title: "Beginner Zumba Basics", url: "https://www.youtube.com/results?search_query=beginner+zumba+15+minutes", durationMin: 15, focus: "Low-impact full body" },
    { title: "Easy Zumba Dance Cardio", url: "https://www.youtube.com/results?search_query=easy+zumba+dance+20+minutes", durationMin: 20, focus: "Steady cardio flow" },
    { title: "Gentle Latin Cardio", url: "https://www.youtube.com/results?search_query=gentle+latin+dance+cardio+12+minutes", durationMin: 12, focus: "Mobility + rhythm" },
  ],
  moderate: [
    { title: "30-Min Zumba Cardio Session", url: "https://www.youtube.com/results?search_query=zumba+cardio+30+minutes", durationMin: 30, focus: "Cardio endurance" },
    { title: "Zumba Fat Burn Dance", url: "https://www.youtube.com/results?search_query=zumba+fat+burn+25+minutes", durationMin: 25, focus: "Fat-burn intervals" },
    { title: "Latin Dance HIIT Lite", url: "https://www.youtube.com/results?search_query=latin+dance+hiit+20+minutes", durationMin: 20, focus: "Core + legs" },
  ],
  high: [
    { title: "High-Energy Zumba HIIT", url: "https://www.youtube.com/results?search_query=high+energy+zumba+hiit+30+minutes", durationMin: 30, focus: "High-intensity cardio" },
    { title: "Power Zumba Sweat Session", url: "https://www.youtube.com/results?search_query=power+zumba+28+minutes", durationMin: 28, focus: "Explosive full body" },
    { title: "Zumba Advanced Intervals", url: "https://www.youtube.com/results?search_query=zumba+advanced+intervals+35+minutes", durationMin: 35, focus: "Intervals + endurance" },
  ],
};

const GOAL_FOCUS = {
  loss: "calorie burn",
  gain: "conditioning",
  pcod: "hormone-friendly low impact",
};

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

const splitDurations = (availableMinutes, intensity) => {
  const warmup = availableMinutes >= 25 ? 5 : 3;
  const cooldown = availableMinutes >= 25 ? 5 : 3;
  let main = availableMinutes - warmup - cooldown;

  if (main < 10) main = 10;

  const segments =
    main <= 20 ? 2 :
    main <= 35 ? 3 : 4;

  const base = Math.floor(main / segments);
  const rem = main % segments;
  const mainDurations = Array.from({ length: segments }, (_, i) => base + (i < rem ? 1 : 0));

  if (intensity === "light") {
    return { warmup: warmup + 1, cooldown: cooldown + 1, mainDurations };
  }
  if (intensity === "high") {
    return { warmup: Math.max(2, warmup - 1), cooldown, mainDurations };
  }
  return { warmup, cooldown, mainDurations };
};

const getTimeBucket = (startMinutes) =>
  startMinutes < 600 ? "morning" : startMinutes < 1020 ? "daytime" : "evening";

const getDurationBucket = (availableMinutes) =>
  availableMinutes <= 35 ? "short" : availableMinutes <= 70 ? "medium" : "long";

const getSessionTitle = ({ goal, timeBucket, durationBucket, intensity }) => {
  const base = GOAL_LIBRARY[goal]?.baseTitle || "Workout";
  const timeLabel = timeBucket === "morning" ? "Morning" : timeBucket === "daytime" ? "Midday" : "Evening";
  const durationLabel = durationBucket === "short" ? "Express" : durationBucket === "medium" ? "Focused" : "Extended";
  const intensityLabel = intensity === "light" ? "Light" : intensity === "high" ? "Power" : "Balanced";
  return `${timeLabel} ${durationLabel} ${base} ${intensityLabel}`.trim();
};

const tuneBlockForContext = ({ title, instructions, timeBucket, intensity, index, total }) => {
  let nextTitle = title;
  let nextInstructions = instructions;

  if (timeBucket === "morning" && index === 0) {
    nextTitle = title.includes("Warm") ? title : `Wake-Up ${title}`;
    nextInstructions = `${instructions} Keep the first minutes easy to wake up the body.`;
  }

  if (timeBucket === "evening" && index === total - 1) {
    nextTitle = title.includes("Recovery") || title.includes("Cooldown") ? title : `${title} Recovery`;
    nextInstructions = `${instructions} Ease the nervous system down for the evening.`;
  }

  if (intensity === "high" && !title.toLowerCase().includes("cooldown")) {
    nextInstructions = `${nextInstructions} Work in sharper intervals and keep rest brief.`;
  } else if (intensity === "light" && !title.toLowerCase().includes("cooldown")) {
    nextInstructions = `${nextInstructions} Keep effort smooth and conversational throughout.`;
  }

  return { title: nextTitle, instructions: nextInstructions };
};

const buildLocalPlan = ({ goal, date, startTime, endTime, intensity, notes, availableMinutes }) => {
  const lib = GOAL_LIBRARY[goal] || GOAL_LIBRARY.loss;
  const { warmup, cooldown, mainDurations } = splitDurations(availableMinutes, intensity);
  const startMinutes = (Number(startTime.slice(0, 2)) * 60) + Number(startTime.slice(3, 5));
  const timeBucket = getTimeBucket(startMinutes);
  const durationBucket = getDurationBucket(availableMinutes);
  const blockPool = lib[durationBucket] || lib.medium;
  const blocks = [{ title: "Warmup", durationMin: warmup, instructions: "Prepare body and breathing." }];

  for (let i = 0; i < mainDurations.length; i += 1) {
    const item = blockPool[i % blockPool.length];
    const tuned = tuneBlockForContext({
      title: item.title,
      instructions: item.instructions,
      timeBucket,
      intensity,
      index: i,
      total: mainDurations.length,
    });
    blocks.push({ title: tuned.title, durationMin: mainDurations[i], instructions: tuned.instructions });
  }

  blocks.push({ title: "Cooldown", durationMin: cooldown, instructions: "Bring heart rate down with stretches." });

  const timeHint = timeBucket === "morning" ? "morning" : timeBucket === "daytime" ? "daytime" : "evening";
  const pool = ZUMBA_LIBRARY[intensity] || ZUMBA_LIBRARY.moderate;
  const zumbaSessions = pool
    .map((item) => ({ item, delta: Math.abs(item.durationMin - Math.min(availableMinutes, 35)) }))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 2)
    .map(({ item }) => ({
      ...item,
      focus: `${item.focus} | Best for ${GOAL_FOCUS[goal] || "overall fitness"}`,
    }));

  return {
    _id: `local-${Date.now()}`,
    date: new Date(`${date}T00:00:00.000Z`).toISOString(),
    startTime,
    endTime,
    availableMinutes,
    goal,
    intensity,
    planTitle: getSessionTitle({ goal, timeBucket, durationBucket, intensity }),
    analysis: `Built for a ${availableMinutes}-minute ${timeHint} slot, this ${intensity}-intensity ${durationBucket} session shifts its focus to match your timing, energy, and ${goal} goal.`,
    blocks,
    zumbaSessions,
    notes,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
};

const resolveZumbaUrl = (session) => {
  const title = session?.title || "zumba workout";
  const fallback = `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
  const raw = (session?.url || "").trim();
  if (!raw) return fallback;

  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes("youtube.com") && parsed.pathname === "/watch") {
      return fallback;
    }
    return raw;
  } catch (_err) {
    return fallback;
  }
};

const getYouTubeVideoId = (url) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1] || null;
      }
    }

    if (host === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }

    return null;
  } catch (_err) {
    return null;
  }
};

const getEmbedUrl = (session) => {
  const videoId = getYouTubeVideoId(session?.url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const formatClock = (totalMinutes) => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getBlockTimeRange = (startTime, blocks, index) => {
  const [hours, minutes] = String(startTime || "").split(":").map(Number);
  if ([hours, minutes].some((value) => Number.isNaN(value))) {
    return "";
  }

  let cursor = (hours * 60) + minutes;
  for (let i = 0; i < index; i += 1) {
    cursor += Number(blocks?.[i]?.durationMin || 0);
  }

  const end = cursor + Number(blocks?.[index]?.durationMin || 0);
  return `${formatClock(cursor)} - ${formatClock(end)}`;
};

const formatCountdown = (totalSeconds) => {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function WorkoutPlanner({ onNavigate, onLogout }) {
  const { apiFetch, buildScopedKey, user } = useAuth();
  const isTrainer = user?.role === "trainer";
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "18:00",
    endTime: "18:45",
    intensity: "moderate",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [plans, setPlans] = useState([]);
  const [historyPlans, setHistoryPlans] = useState([]);
  const [latestPlan, setLatestPlan] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("18:00");
  const [reminderHydrated, setReminderHydrated] = useState(false);
  const [reminderSyncing, setReminderSyncing] = useState(false);
  const [notifyPermission, setNotifyPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [nextReminderAt, setNextReminderAt] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerMessage, setTimerMessage] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const reminderEnabledKey = buildScopedKey("wf_reminder_enabled");
  const reminderTimeKey = buildScopedKey("wf_reminder_time");
  const reminderLastSentKey = buildScopedKey("wf_reminder_last_sent");
  const workoutPlansKey = buildScopedKey("wf_workout_plans");
  const reminderSyncTimeoutRef = useRef(null);
  const activeEmbedUrl = getEmbedUrl(activeSession);
  const currentBlock = latestPlan?.blocks?.[currentBlockIndex] || null;
  const upcomingPlans = isTrainer ? plans : plans.filter((plan) => plan.status === "scheduled");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const getRequestedMinutes = () => {
    const [sh, sm] = String(form.startTime || "").split(":").map(Number);
    const [eh, em] = String(form.endTime || "").split(":").map(Number);
    if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return 0;
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const adjustedEnd = end <= start ? end + 1440 : end;
    return adjustedEnd - start;
  };

  const loadPlans = async () => {
    try {
      const data = await apiFetch("/api/workout/schedule?days=30", { timeoutMs: 30000 });
      setPlans(data.plans || []);
      writeJson(workoutPlansKey, data.plans || []);
    } catch (_err) {
      setPlans(readJson(workoutPlansKey, []));
    }
  };

  const loadHistory = async (minutes) => {
    try {
      const data = await apiFetch(`/api/workout/history?minutes=${minutes}&limit=8`, { timeoutMs: 30000 });
      setHistoryPlans(data.plans || []);
    } catch (_err) {
      const localPlans = readJson(workoutPlansKey, []);
      setHistoryPlans(
        localPlans
          .filter((plan) => !minutes || plan.availableMinutes === minutes)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 8)
      );
    }
  };

  useEffect(() => {
    let active = true;

    const hydrateReminder = async () => {
      const localEnabled = localStorage.getItem(reminderEnabledKey) === "true";
      const localTime = localStorage.getItem(reminderTimeKey) || "18:00";

      setReminderEnabled(localEnabled);
      setReminderTime(localTime);
      setPlans([]);
      setHistoryPlans([]);
      setLatestPlan(null);
      setActiveSession(null);

      const localPlans = readJson(workoutPlansKey, []);
      if (localPlans.length) {
        setPlans(localPlans);
      }

      try {
        const data = await apiFetch("/api/workout/reminder", { timeoutMs: 12000 });
        if (!active) return;

        const nextEnabled = data?.reminder?.enabled === true;
        const nextTime = String(data?.reminder?.time || "18:00");
        setReminderEnabled(nextEnabled);
        setReminderTime(nextTime);
        localStorage.setItem(reminderEnabledKey, String(nextEnabled));
        localStorage.setItem(reminderTimeKey, nextTime);
      } catch (_err) {
        // Keep local fallback for resilience when backend is down.
      } finally {
        if (active) setReminderHydrated(true);
      }
    };

    setReminderHydrated(false);
    hydrateReminder();

    return () => {
      active = false;
    };
  }, [apiFetch, reminderEnabledKey, reminderTimeKey, user?._id, workoutPlansKey]);

  useEffect(() => {
    loadPlans();
    loadHistory(getRequestedMinutes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    if (!isTrainer) return;
    const fetchClients = async () => {
      try {
        const data = await apiFetch(`/api/trainer/clients/${user?._id}`);
        setClients(data);
        if (data.length > 0) setSelectedClientId(data[0]._id);
      } catch (err) {
        console.error("Failed to fetch clients", err);
      }
    };
    fetchClients();
  }, [isTrainer, user?._id, apiFetch]);

  useEffect(() => {
    const minutes = getRequestedMinutes();
    if (minutes >= 15) {
      loadHistory(minutes);
    } else {
      setHistoryPlans([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startTime, form.endTime]);

  useEffect(() => {
    const first = latestPlan?.zumbaSessions?.[0] || null;
    setActiveSession(first);
  }, [latestPlan]);

  useEffect(() => {
    const firstDuration = Number(latestPlan?.blocks?.[0]?.durationMin || 0);
    setTimerRunning(false);
    setCurrentBlockIndex(0);
    setSecondsLeft(firstDuration > 0 ? firstDuration * 60 : 0);
    setTimerMessage("");
  }, [latestPlan]);

  useEffect(() => {
    localStorage.setItem(reminderEnabledKey, String(reminderEnabled));
  }, [reminderEnabled, reminderEnabledKey]);

  useEffect(() => {
    localStorage.setItem(reminderTimeKey, reminderTime);
  }, [reminderTime, reminderTimeKey]);

  useEffect(() => {
    if (!reminderHydrated) return undefined;

    const hhmm = String(reminderTime || "");
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(hhmm)) return undefined;

    if (reminderSyncTimeoutRef.current) {
      window.clearTimeout(reminderSyncTimeoutRef.current);
    }

    reminderSyncTimeoutRef.current = window.setTimeout(async () => {
      try {
        setReminderSyncing(true);
        await apiFetch("/api/workout/reminder", {
          method: "PUT",
          body: JSON.stringify({
            enabled: reminderEnabled,
            time: hhmm,
          }),
          timeoutMs: 12000,
        });
      } catch (_err) {
        setStatus("Saved locally. Reminder sync to server will retry when backend is available.");
      } finally {
        setReminderSyncing(false);
      }
    }, 500);

    return () => {
      if (reminderSyncTimeoutRef.current) {
        window.clearTimeout(reminderSyncTimeoutRef.current);
      }
    };
  }, [apiFetch, reminderEnabled, reminderHydrated, reminderTime]);

  useEffect(() => {
    if (!timerRunning || !latestPlan?.blocks?.length) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous > 1) {
          return previous - 1;
        }

        const AudioCtor =
          typeof window !== "undefined"
            ? window.AudioContext || window.webkitAudioContext
            : null;
        const audioContext = AudioCtor ? new AudioCtor() : null;

        if (audioContext) {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = 880;
          gain.gain.value = 0.08;
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.25);
          window.setTimeout(() => audioContext.close().catch(() => {}), 350);
        }

        const finishedBlock = latestPlan.blocks[currentBlockIndex];
        const nextIndex = currentBlockIndex + 1;

        if (nextIndex < latestPlan.blocks.length) {
          const nextBlock = latestPlan.blocks[nextIndex];
          setTimerMessage(`${finishedBlock.title} finished. Start ${nextBlock.title}.`);
          setCurrentBlockIndex(nextIndex);
          return Number(nextBlock.durationMin || 0) * 60;
        }

        setTimerRunning(false);
        setTimerMessage("Workout complete. Great job.");
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerRunning, latestPlan, currentBlockIndex]);

  useEffect(() => {
    if (!reminderEnabled) {
      setNextReminderAt("");
      return undefined;
    }

    const [hh, mm] = reminderTime.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) {
      setNextReminderAt("");
      return undefined;
    }

    const refreshNextReminder = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(hh, mm, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      setNextReminderAt(next.toLocaleString());
    };

    refreshNextReminder();
    const timerId = window.setInterval(refreshNextReminder, 30000);
    return () => window.clearInterval(timerId);
  }, [reminderEnabled, reminderTime]);

  const createPlan = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setStatus("");
    setSaveStatus("");

    if (isTrainer && !selectedClientId) {
      setStatus("Please select a client first.");
      setLoading(false);
      return;
    }

    const availableMinutes = getRequestedMinutes();

    if (availableMinutes < 15) {
      setStatus("Minimum free slot is 15 minutes.");
      setLoading(false);
      return;
    }

    if (availableMinutes > 180) {
      setStatus("Maximum free slot is 180 minutes. Please choose a shorter range.");
      setLoading(false);
      return;
    }

    try {
      if (isTrainer) {
        const body = {
          userId: selectedClientId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          intensity: form.intensity,
          notes: form.notes
        };
        const res = await apiFetch("/api/trainer/generate-program", {
          method: "POST",
          body: JSON.stringify(body),
          timeoutMs: 30000,
        });

        setLatestPlan(res);
        setSaveStatus("");
      } else {
        const targetGoal = user?.goal || "loss";
        const localPlan = buildLocalPlan({
          goal: targetGoal,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          intensity: form.intensity,
          notes: form.notes,
          availableMinutes,
        });
        const localPlans = [localPlan, ...readJson(workoutPlansKey, []).filter((plan) => plan._id !== localPlan._id)].slice(0, 60);
        writeJson(workoutPlansKey, localPlans);
        setLatestPlan(localPlan);
        setPlans(localPlans);
        setHistoryPlans(localPlans.filter((plan) => plan.availableMinutes === availableMinutes).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8));
        
        const data = await apiFetch("/api/workout/plan", {
          method: "POST",
          body: JSON.stringify(form),
          timeoutMs: 15000,
        });

        const mergedPlans = [data.plan, ...readJson(workoutPlansKey, []).filter((plan) => plan._id !== localPlan._id && plan._id !== data.plan._id)].slice(0, 60);
        writeJson(workoutPlansKey, mergedPlans);
        setLatestPlan(data.plan);
        setPlans(mergedPlans);
        setHistoryPlans(
          mergedPlans
            .filter((plan) => plan.availableMinutes === data.plan.availableMinutes)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8)
        );
        setStatus("Workout plan generated and scheduled.");
        loadPlans();
        loadHistory(data.plan.availableMinutes);
      }
    } catch (err) {
      setStatus(err.message ? `${err.message}` : "Backend is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const savePlanToClient = async () => {
    if (!latestPlan || !selectedClientId) return;
    setIsSaving(true);

    try {
      const clientName = clients.find(c => c._id === selectedClientId)?.name || "Client";
      const totalMinutes = getRequestedMinutes();
      const body = {
        userId: selectedClientId,
        sessionName: latestPlan.sessionName || latestPlan.planTitle,
        blocks: latestPlan.blocks || [],
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        totalMinutes,
        intensity: form.intensity
      };

      const res = await apiFetch("/api/trainer/save-program", {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 15000,
      });

      setSaveStatus("saved");
      setStatus(`✅ Program saved to ${clientName}'s workout plan!`);
      
      const mergedPlans = [res.plan, ...readJson(workoutPlansKey, [])].slice(0, 60);
      writeJson(workoutPlansKey, mergedPlans);
      setPlans(mergedPlans);
      loadHistory(totalMinutes);
    } catch (err) {
      setSaveStatus("error");
      setStatus("Failed to save — try again");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id, nextStatus) => {
    if (!id) return;

    const previousPlans = readJson(workoutPlansKey, []);
    const updatedPlans = previousPlans.map((plan) =>
      plan._id === id ? { ...plan, status: nextStatus } : plan
    );
    writeJson(workoutPlansKey, updatedPlans);
    setPlans(updatedPlans);

    try {
      await apiFetch(`/api/workout/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
        timeoutMs: 30000,
      });
      await loadPlans();
    } catch (_err) {
      setStatus("Could not sync status with server right now. Saved locally.");
    }
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") {
      setStatus("Notifications are not supported in this browser.");
      return;
    }
    const res = await Notification.requestPermission();
    setNotifyPermission(res);
    setStatus(res === "granted" ? "Notifications enabled for daily reminders." : "Notification permission denied.");
  };

  const sendTestReminder = () => {
    if (typeof Notification === "undefined") {
      setStatus("Notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission !== "granted") {
      setStatus("Enable notifications first.");
      return;
    }
    new Notification("Workout Reminder Test", {
      body: "This is a test reminder from Workout Planner.",
    });
    setStatus("Test reminder sent.");
  };

  const startWorkoutTimer = () => {
    const firstDuration = Number(latestPlan?.blocks?.[0]?.durationMin || 0);
    if (!firstDuration) return;
    setCurrentBlockIndex(0);
    setSecondsLeft(firstDuration * 60);
    setTimerMessage(`Started ${latestPlan.blocks[0].title}.`);
    setTimerRunning(true);
  };

  const pauseWorkoutTimer = () => {
    setTimerRunning(false);
    setTimerMessage("Timer paused.");
  };

  const resumeWorkoutTimer = () => {
    if (!currentBlock || secondsLeft <= 0) return;
    setTimerMessage(`Resumed ${currentBlock.title}.`);
    setTimerRunning(true);
  };

  const resetWorkoutTimer = () => {
    const firstDuration = Number(latestPlan?.blocks?.[0]?.durationMin || 0);
    setTimerRunning(false);
    setCurrentBlockIndex(0);
    setSecondsLeft(firstDuration > 0 ? firstDuration * 60 : 0);
    setTimerMessage("Timer reset.");
  };

  return (
    <div className="trainer-theme trainer-layout">
      <Sidebar active="workout" onNavigate={onNavigate} onLogout={onLogout} />
      <main className="trainer-content">
        <div className="flex items-center justify-between mb-24">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Program Builder</h1>
        </div>

        <div className="flex gap-24">
          {/* Left Panel (40%) */}
          <div style={{ flex: "0 0 40%" }}>
            <form className="trainer-card" onSubmit={createPlan}>
              <h2 className="section-title">Session Parameters</h2>
              
              <div style={{ marginBottom: "16px" }}>
                <label className="form-label">Select Client</label>
                <select className="form-select" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                   {clients.length === 0 ? (
                     <option value="" disabled>No clients found — add clients first</option>
                   ) : (
                     clients.map(c => (
                       <option key={c._id} value={c._id}>
                         {c.name} ({c.fitnessGoal === "loss" ? "Fat Loss" : c.fitnessGoal === "gain" ? "Weight Gain" : "PCOD Care"})
                       </option>
                     ))
                   )}
                </select>
              </div>

              <div className="flex gap-16 mb-24" style={{ marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={set("date")} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Intensity</label>
                  <select className="form-select" value={form.intensity} onChange={set("intensity")}>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-16" style={{ marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Start Time</label>
                  <input className="form-input" type="time" value={form.startTime} onChange={set("startTime")} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">End Time</label>
                  <input className="form-input" type="time" value={form.endTime} onChange={set("endTime")} required />
                </div>
              </div>
              <div style={{ marginBottom: "24px", color: "var(--text-muted)", fontSize: "14px" }}>
                 ⏱️ Session duration: {getRequestedMinutes()} minutes
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label className="form-label">Coach Notes</label>
                <textarea className="form-textarea" rows="4" value={form.notes} onChange={set("notes")} placeholder="Any constraints, injuries, energy level..." />
              </div>

              <button className="btn-filled w-full" type="submit" disabled={loading}>
                {loading ? "Generating..." : "⚡ Generate Program"}
              </button>
              {status && <div style={{ marginTop: "12px", color: "var(--accent-green)", fontSize: "14px" }}>{status}</div>}
            </form>
          </div>

          {/* Right Panel (60%) */}
          <div style={{ flex: "0 0 calc(60% - 24px)", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="trainer-card">
              <div className="flex justify-between items-center" style={{ marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <h2 className="section-title" style={{ margin: 0 }}>Generated Program</h2>
                {latestPlan && isTrainer && (
                  <div className="flex gap-8">
                    <button type="button" className="btn-outline" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={createPlan} disabled={loading}>🔄 Regenerate</button>
                    <button type="button" className={`btn-filled ${saveStatus === "saved" ? "opacity-50" : ""}`} style={{ padding: "6px 12px", fontSize: "12px", width: "auto" }} onClick={savePlanToClient} disabled={saveStatus === "saved" || isSaving}>
                      {isSaving ? "Saving..." : saveStatus === "saved" ? "✅ Saved" : "📋 Save to Client"}
                    </button>
                  </div>
                )}
              </div>

              {latestPlan ? (
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", color: "var(--accent-green)", marginBottom: "8px" }}>{latestPlan.sessionName || latestPlan.planTitle}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{latestPlan.analysis}</p>
                  </div>

                  <div className="flex-col gap-8">
                    {(() => {
                      const reqMins = getRequestedMinutes();
                      const [startH, startM] = form.startTime.split(':').map(Number);
                      let currentMins = startH * 60 + startM;
                      let totalDur = 0;

                      const blocksList = (latestPlan.blocks || []).map((b, i) => {
                        const sHour = Math.floor(currentMins / 60) % 24;
                        const sMin = Math.abs(currentMins) % 60;
                        const startStr = `${String(sHour).padStart(2, '0')}:${String(sMin).padStart(2, '0')}`;
                        
                        const dur = Number(b.duration || b.durationMin || 0);
                        currentMins += dur;
                        totalDur += dur;

                        return (
                          <div key={i} className="flex justify-between items-center" style={{ background: "var(--bg-stat)", padding: "16px", borderRadius: "8px", borderLeft: "3px solid var(--accent-green)" }}>
                            <div className="flex gap-16 items-start">
                              <div style={{ color: "var(--accent-green)", fontSize: "14px", fontWeight: "600", width: "45px" }}>{startStr}</div>
                              <div>
                                <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "4px" }}>{b.name || b.title}</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{b.description || b.instructions}</div>
                              </div>
                            </div>
                            <div style={{ fontWeight: "bold", color: "var(--accent-green)" }}>{dur} min</div>
                          </div>
                        );
                      });
                      
                      return (
                        <>
                          {blocksList}
                          <div style={{ marginTop: "16px", textAlign: "right", fontWeight: "bold", color: totalDur === reqMins ? "var(--accent-green)" : "var(--danger-color)" }}>
                            {totalDur === reqMins ? `Total: ${totalDur}/${reqMins} min ✅` : `⚠️ ${totalDur}/${reqMins} min — ${Math.abs(reqMins - totalDur)} min gap`}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  Configure session parameters and generate a program to see structured blocks here.
                </div>
              )}
            </div>

            <div className="trainer-card">
              <h2 className="section-title">Recent Programs</h2>
              {historyPlans.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No previous saved workouts.</p>
              ) : (
                <div className="flex-col gap-16">
                  {historyPlans.slice(0, 3).map((plan) => (
                    <div key={plan._id} className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                      <div>
                        <div style={{ fontWeight: "600", marginBottom: "4px" }}>{plan.planTitle}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                           {new Date(plan.date).toLocaleDateString()} | {plan.availableMinutes} min
                        </div>
                      </div>
                      <span className="badge badge-gray">{plan.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
