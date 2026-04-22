import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
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
  const [trainerClients, setTrainerClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
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

    if (isTrainer && user?._id) {
       apiFetch(`/api/trainer/clients/${user._id}`)
         .then((data) => {
            if (active) setTrainerClients(data);
         })
         .catch((err) => console.error("Failed to fetch trainer clients", err));
    }

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
    
    try {
      const pendingRaw = localStorage.getItem("wf_pending_program");
      if (pendingRaw) {
        localStorage.removeItem("wf_pending_program");
        const pending = JSON.parse(pendingRaw);
        if (pending && pending.sessionName) {
           const localPlan = {
             _id: `local-ai-${Date.now()}`,
             date: new Date().toISOString(),
             startTime: form.startTime,
             endTime: form.endTime,
             availableMinutes: pending.totalMinutes || 30,
             planTitle: pending.sessionName,
             intensity: pending.intensity || "moderate",
             blocks: pending.blocks || [],
             notes: pending.notes || "",
             status: "scheduled",
             createdAt: new Date().toISOString()
           };
           setLatestPlan(localPlan);
           setStatus("Loaded AI suggested program.");
           
           setForm(f => ({
             ...f, 
             intensity: localPlan.intensity, 
             notes: localPlan.notes
           }));
        }
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

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
    e.preventDefault();
    setLoading(true);
    setStatus("");
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

    const localPlan = buildLocalPlan({
      goal: user?.goal || "loss",
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
    setHistoryPlans(
      localPlans
        .filter((plan) => plan.availableMinutes === availableMinutes)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8)
    );
    setStatus("Workout plan ready. Saving in background...");
    setLoading(false);

    try {
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
    } catch (err) {
      setStatus(err.message ? `${err.message} Saved locally instead.` : "Saved locally. Backend is unavailable.");
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

  const handleAssignToClient = async () => {
    if (!selectedClientId) {
      toast.error("Please select a client first.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/programs/assign", {
        method: "POST",
        body: JSON.stringify({ programId: latestPlan._id, clientId: selectedClientId }),
      });
      toast.success("Program successfully assigned!");
      setLatestPlan((p) => ({ ...p, status: "active", assignedTo: selectedClientId }));
      loadPlans();
    } catch (err) {
      toast.error(err.message || "Failed to assign program");
    } finally {
      setLoading(false);
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
    <div className={styles.layout}>
      <Toaster position="top-right" />
      <Sidebar active="workout" onNavigate={onNavigate} onLogout={onLogout} />
      <main className={styles.main}>
        <div className="page-header">
          <div>
            <h1>{isTrainer ? "Trainer Program Builder" : "Workout Planner"}</h1>
            <p>
              {isTrainer
                ? "Build coach-ready sessions, review reusable templates, and manage assigned client programs."
                : "Give your exact free time and get an analyzed workout schedule"}
            </p>
          </div>
        </div>

        {isTrainer ? (
          <div className="grid-3">
            <div className="card">
              <div className="card-title">Assigned Clients</div>
              <div className={styles.stack}>
                {TRAINER_CLIENTS.map((client) => (
                  <div key={client.name} className={styles.trainerCard}>
                    <strong>{client.name}</strong>
                    <span>{client.goal}</span>
                    <p>{client.cadence}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Program Templates</div>
              <div className={styles.stack}>
                {TRAINER_TEMPLATES.map((template) => (
                  <div key={template.title} className={styles.trainerCard}>
                    <strong>{template.title}</strong>
                    <p>{template.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Coach Checklist</div>
              <div className={styles.stack}>
                {TRAINER_CHECKLIST.map((item) => (
                  <div key={item} className={styles.coachItem}>
                    <span className={styles.coachDot} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid-2">
          <form className="card" onSubmit={createPlan}>
            <div className="card-title">{isTrainer ? "Build From Session Window" : "Plan From Free Time"}</div>

            <div className={styles.row2}>
              <div>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={set("date")} required />
              </div>
              <div>
                <label className="form-label">Intensity</label>
                <select className="form-input" value={form.intensity} onChange={set("intensity")}>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className={styles.row2}>
              <div>
                <label className="form-label">Free Start Time</label>
                <input className="form-input" type="time" value={form.startTime} onChange={set("startTime")} required />
              </div>
              <div>
                <label className="form-label">Free End Time</label>
                <input className="form-input" type="time" value={form.endTime} onChange={set("endTime")} required />
              </div>
            </div>

            <div>
              <label className="form-label">Notes (optional)</label>
              <textarea className={styles.textarea} value={form.notes} onChange={set("notes")} placeholder="Any constraints, injuries, energy level..." />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading
                ? "Generating..."
                : isTrainer
                  ? "Generate Client Program"
                  : "Analyze Time & Schedule Workout"}
            </button>
            {status ? <p className={styles.status}>{status}</p> : null}
          </form>

          <div className="card">
            <div className="card-title">{isTrainer ? "Latest Client Program" : "Latest Generated Plan"}</div>
            {latestPlan ? (
              <div className={styles.stack}>
                <div className={styles.title}>{latestPlan.planTitle}</div>
                <p className={styles.muted}>{latestPlan.analysis}</p>
                <div className={styles.timerPanel}>
                  <div className={styles.timerHeader}>
                    <div>
                      <div className={styles.subTitle}>Workout Timer</div>
                      <p className={styles.muted}>
                        {currentBlock
                          ? `${currentBlock.title} | ${getBlockTimeRange(latestPlan.startTime, latestPlan.blocks, currentBlockIndex)}`
                          : "Generate a plan to start timing."}
                      </p>
                    </div>
                    <div className={styles.timerClock}>{formatCountdown(secondsLeft)}</div>
                  </div>
                  <div className={styles.timerActions}>
                    <button className="btn btn-primary" type="button" onClick={startWorkoutTimer} disabled={!latestPlan?.blocks?.length}>
                      Start
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={pauseWorkoutTimer} disabled={!timerRunning}>
                      Pause
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={resumeWorkoutTimer} disabled={timerRunning || !currentBlock || secondsLeft <= 0}>
                      Resume
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={resetWorkoutTimer} disabled={!latestPlan?.blocks?.length}>
                      Reset
                    </button>
                  </div>
                  {timerMessage ? <p className={styles.timerMessage}>{timerMessage}</p> : null}
                </div>
                {(latestPlan.blocks || []).map((b, i) => (
                  <div
                    key={`${b.title}-${i}`}
                    className={`${styles.block} ${i === currentBlockIndex && (timerRunning || timerMessage) ? styles.blockActive : ""}`}
                  >
                    <span>
                      {b.title}
                      <span className={styles.muted}> ({getBlockTimeRange(latestPlan.startTime, latestPlan.blocks, i)})</span>
                    </span>
                    <span>{b.durationMin} min</span>
                  </div>
                ))}
                {(latestPlan.zumbaSessions || []).length > 0 ? (
                  <div className={styles.zumbaBox}>
                    <div className={styles.subTitle}>Recommended Zumba Sessions</div>
                    {latestPlan.zumbaSessions.map((session, i) => (
                      <button
                        key={`${session.title}-${i}`}
                        type="button"
                        className={styles.zumbaLink}
                        onClick={() => setActiveSession(session)}
                      >
                        <span>{session.title} ({session.durationMin} min)</span>
                        <span className={styles.muted}>{session.focus}</span>
                      </button>
                    ))}
                    {activeSession ? (
                      <div className={styles.playerWrap}>
                        {activeEmbedUrl ? (
                          <iframe
                            title={`zumba-${activeSession.title}`}
                            src={activeEmbedUrl}
                            className={styles.player}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        ) : (
                          <div className={styles.playerFallback}>
                            <div className={styles.title}>{activeSession.title}</div>
                            <p className={styles.muted}>
                              This recommendation opens as a YouTube search result instead of a direct embeddable video.
                            </p>
                          </div>
                        )}
                        <a
                          href={resolveZumbaUrl(activeSession)}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.quickLink}
                        >
                          Open in YouTube
                        </a>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* --- FEATURE 1: ASSIGN TO CLIENT BLOCK --- */}
                {isTrainer && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "var(--light-bg)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                     <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>Assign to Client</h4>
                     {latestPlan.status === "active" ? (
                       <p style={{ color: "var(--accent-green)", fontWeight: "bold", margin: 0 }}>✓ Program Assigned</p>
                     ) : (
                       <div style={{ display: "flex", gap: "8px" }}>
                         <select 
                            className="form-input" 
                            style={{ flex: 1, margin: 0 }} 
                            value={selectedClientId} 
                            onChange={(e) => setSelectedClientId(e.target.value)}
                         >
                           <option value="">-- Choose Client --</option>
                           {trainerClients.map(client => (
                             <option key={client._id} value={client._id}>{client.name} - {client.fitnessGoal || "Goal Unset"}</option>
                           ))}
                         </select>
                         <button className="btn btn-primary" onClick={handleAssignToClient} disabled={loading || !selectedClientId}>
                           {loading ? "..." : "Assign"}
                         </button>
                       </div>
                     )}
                  </div>
                )}
                
              </div>
            ) : (
              <p className={styles.muted}>Generate a plan to see structured blocks here.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">{isTrainer ? "Program Reminder" : "Daily Reminder"}</div>
          <div className={styles.row2}>
            <div>
              <label className="form-label">Reminder Time</label>
              <input
                className="form-input"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Notification</label>
              <div className={styles.actions}>
                <button className="btn btn-ghost" onClick={enableNotifications} type="button">
                  {notifyPermission === "granted" ? "Notifications On" : "Enable Notifications"}
                </button>
                <button className="btn btn-ghost" onClick={sendTestReminder} type="button">
                  Test Reminder
                </button>
                <button
                  className={`btn ${reminderEnabled ? "btn-primary" : "btn-sage"}`}
                  onClick={() => setReminderEnabled((v) => !v)}
                  type="button"
                >
                  {reminderEnabled ? "Reminder Enabled" : "Enable Daily Reminder"}
                </button>
              </div>
            </div>
          </div>
          <p className={styles.muted}>
            {isTrainer
              ? `Reminder runs daily at ${reminderTime}. Use it to review deliveries and client follow-ups.`
              : `Reminder runs daily at ${reminderTime}. Keep browser notifications allowed.`}
          </p>
          {reminderSyncing ? <p className={styles.muted}>Syncing reminder settings...</p> : null}
          {nextReminderAt ? <p className={styles.muted}>Next reminder: {nextReminderAt}</p> : null}
        </div>

        <div className="card">
          <div className="card-title">Previous Workouts For {getRequestedMinutes() || 0} Min</div>
          {historyPlans.length === 0 ? (
            <p className={styles.muted}>No previous saved workouts for this duration yet.</p>
          ) : (
            <div className={styles.stack}>
              {historyPlans.map((plan) => (
                <div key={`history-${plan._id}`} className={styles.planRow}>
                  <div className={styles.planMain}>
                    <div className={styles.title}>{plan.planTitle}</div>
                    <div className={styles.muted}>
                      {new Date(plan.date).toLocaleDateString()} | {plan.startTime} - {plan.endTime} | {plan.availableMinutes} min
                    </div>
                    <div className={styles.blockList}>
                      {(plan.blocks || []).map((block, idx) => (
                        <span key={`${plan._id}-block-${idx}`} className={styles.historyChip}>
                          {block.title} {block.durationMin}m
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={styles.badge} style={{ background: STATUS_COLORS[plan.status] || "var(--muted)" }}>
                    {plan.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">{isTrainer ? "Assigned Client Programs" : "Upcoming Scheduled Workouts"}</div>
          {upcomingPlans.length === 0 ? (
            <p className={styles.muted}>{isTrainer ? "No assigned client programs yet." : "No scheduled workouts yet."}</p>
          ) : (
            <div className={styles.stack}>
              {upcomingPlans.map((plan) => (
                <div key={plan._id} className={styles.planRow}>
                  <div className={styles.planMain}>
                    <div className={styles.title}>{plan.planTitle}</div>
                    <div className={styles.muted}>
                      {new Date(plan.date).toLocaleDateString()} | {plan.startTime} - {plan.endTime} | {plan.availableMinutes} min
                    </div>
                    {(plan.zumbaSessions || []).length > 0 ? (
                      <div className={styles.zumbaMiniRow}>
                        {plan.zumbaSessions.map((session, i) => (
                          <a
                            key={`${plan._id}-${i}`}
                            href={resolveZumbaUrl(session)}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.quickLink}
                          >
                            Play: {session.title}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.actions}>
                    <span className={styles.badge} style={{ background: STATUS_COLORS[plan.status] || "var(--muted)" }}>
                      {plan.status}
                    </span>
                    {plan.status === "scheduled" ? (
                      <>
                        <button className="btn btn-ghost" type="button" onClick={() => updateStatus(plan._id, "completed")}>
                          {isTrainer ? "Delivered" : "Done"}
                        </button>
                        <button className="btn btn-ghost" type="button" onClick={() => updateStatus(plan._id, "skipped")}>
                          {isTrainer ? "Hold" : "Skip"}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
