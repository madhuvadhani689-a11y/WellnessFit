import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import BreathingAnimation from "../components/BreathingAnimation";
import MoodMusicPlayer from "../components/MoodMusicPlayer";
import styles from "./Mindfulness.module.css";

const PRESET_SECONDS = [60, 180, 300, 600];
const MUSIC_STYLES = [
  { key: "rain", label: "Rain" },
  { key: "ocean", label: "Ocean" },
  { key: "forest", label: "Forest" },
  { key: "wind", label: "Wind" },
  { key: "fire", label: "Fire" },
];

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

function playMildCompletionSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.22);
    osc.frequency.setValueAtTime(783.99, now + 0.4);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.62);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch (_err) {}
}

export default function Mindfulness({ onNavigate, onLogout }) {
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [notifyPermission, setNotifyPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [musicOn, setMusicOn] = useState(false);
  const [musicStyle, setMusicStyle] = useState("rain");
  const [musicVolume, setMusicVolume] = useState(30);
  const [localTracks, setLocalTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [songVolume, setSongVolume] = useState(80);

  const timerRef = useRef(null);
  const songAudioRef = useRef(null);
  const uploadedUrlsRef = useRef([]);
  const musicRef = useRef({
    ctx: null,
    masterGain: null,
    nodes: [],
  });

  const progress = useMemo(() => {
    if (durationSeconds <= 0) return 0;
    return ((durationSeconds - secondsLeft) / durationSeconds) * 100;
  }, [durationSeconds, secondsLeft]);

  const stopMusic = () => {
    const m = musicRef.current;
    if (m.nodes) {
      if (m.nodes.chirpInterval) clearInterval(m.nodes.chirpInterval);
      if (m.nodes.crackleInterval) clearInterval(m.nodes.crackleInterval);
      if (Array.isArray(m.nodes)) {
        m.nodes.forEach(node => {
          try { node.stop(); } catch(e) {}
        });
      }
    }
    if (m.ctx && m.ctx.state !== "closed") {
      try { m.ctx.close().catch(() => {}); } catch(e) {}
    }
    musicRef.current = { ctx: null, masterGain: null, nodes: [] };
  };

  const startMusic = async (styleToPlay = musicStyle) => {
    try {
      stopMusic();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        setStatus("Background audio is not supported in this browser.");
        return;
      }
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      
      const targetVol = Math.max(0, Math.min(1, musicVolume / 100));
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.5);

      const nodes = [];

      const createWhiteNoise = () => {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        return noiseSource;
      };

      const createBrownNoise = () => {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        return noiseSource;
      };

      if (styleToPlay === "rain") {
        const noise = createWhiteNoise();
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;
        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        nodes.push(noise);

      } else if (styleToPlay === "ocean") {
        const noise = createBrownNoise();
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;
        
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.1;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 300;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        noise.connect(filter);
        filter.connect(masterGain);
        
        noise.start();
        lfo.start();
        nodes.push(noise, lfo);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 100;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.1;
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        nodes.push(osc);

      } else if (styleToPlay === "forest") {
        const noise = createWhiteNoise();
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 2500;
        filter.Q.value = 0.5;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.1;
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start();
        nodes.push(noise);

        const chirpInterval = setInterval(() => {
          if (ctx.state !== "running") return;
          const osc = ctx.createOscillator();
          const chirpGain = ctx.createGain();
          osc.type = "sine";
          
          const now = ctx.currentTime;
          const startFreq = 2000 + Math.random() * 1000;
          osc.frequency.setValueAtTime(startFreq, now);
          osc.frequency.exponentialRampToValueAtTime(startFreq + 500, now + 0.1);
          
          chirpGain.gain.setValueAtTime(0, now);
          chirpGain.gain.linearRampToValueAtTime(0.05, now + 0.05);
          chirpGain.gain.linearRampToValueAtTime(0, now + 0.15);
          
          osc.connect(chirpGain);
          chirpGain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.2);
        }, 3000);
        nodes.chirpInterval = chirpInterval;

      } else if (styleToPlay === "wind") {
        const noise = createWhiteNoise();
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.15;
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 800;
        filter.frequency.value = 1000;
        
        const windVolume = ctx.createGain();
        windVolume.gain.value = 0.5;
        
        const volLfo = ctx.createOscillator();
        volLfo.type = "sine";
        volLfo.frequency.value = 0.1;
        const volLfoGain = ctx.createGain();
        volLfoGain.gain.value = 0.3;
        volLfo.connect(volLfoGain);
        volLfoGain.connect(windVolume.gain);
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        noise.connect(filter);
        filter.connect(windVolume);
        windVolume.connect(masterGain);
        
        noise.start();
        lfo.start();
        volLfo.start();
        nodes.push(noise, lfo, volLfo);

      } else if (styleToPlay === "fire") {
        const noise = createBrownNoise();
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.8;
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start();
        nodes.push(noise);

        const crackleInterval = setInterval(() => {
          if (ctx.state !== "running") return;
          if (Math.random() > 0.3) return;
          const osc = ctx.createOscillator();
          const chirpGain = ctx.createGain();
          osc.type = "square";
          
          const now = ctx.currentTime;
          osc.frequency.setValueAtTime(100 + Math.random() * 500, now);
          
          chirpGain.gain.setValueAtTime(0, now);
          chirpGain.gain.linearRampToValueAtTime(0.02, now + 0.01);
          chirpGain.gain.linearRampToValueAtTime(0, now + 0.05);
          
          osc.connect(chirpGain);
          chirpGain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.06);
        }, 150);
        nodes.crackleInterval = crackleInterval;
      }

      musicRef.current = {
        ctx,
        masterGain,
        nodes,
      };

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      setMusicOn(true);
      setStatus(`Playing: ${MUSIC_STYLES.find((s) => s.key === styleToPlay)?.label || "Calm Music"}`);
    } catch (_err) {
      console.error(_err);
      setStatus("Error generating audio in this browser.");
    }
  };

  const completeTimer = () => {
    setIsRunning(false);
    setStatus("Session complete. Great work.");
    playMildCompletionSound();

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Mindfulness timer complete", {
        body: "Your session finished. Take a slow breath before moving on.",
      });
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          completeTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (musicOn) {
      startMusic(musicStyle);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicStyle]);

  useEffect(() => {
    if (!musicOn) return;
    const m = musicRef.current;
    if (!m.masterGain || !m.ctx) return;
    const now = m.ctx.currentTime;
    const targetVol = Math.max(0, Math.min(1, musicVolume / 100));
    m.masterGain.gain.cancelScheduledValues(now);
    m.masterGain.gain.setValueAtTime(Math.max(m.masterGain.gain.value, 0.0001), now);
    m.masterGain.gain.linearRampToValueAtTime(targetVol, now + 0.2);
  }, [musicVolume, musicOn]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopMusic();
      uploadedUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      uploadedUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const audio = songAudioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, songVolume / 100));
  }, [songVolume]);

  const pickPreset = (s) => {
    setDurationSeconds(s);
    setSecondsLeft(s);
    setIsRunning(false);
    setStatus("");
  };

  const startTimer = () => {
    if (secondsLeft <= 0) setSecondsLeft(durationSeconds);
    setStatus("");
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setStatus("Timer paused.");
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(durationSeconds);
    setStatus("Timer reset.");
  };

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") {
      setNotifyPermission("unsupported");
      setStatus("Notifications are not supported on this browser.");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifyPermission(result);
    setStatus(result === "granted" ? "Notifications enabled." : "Notifications not enabled.");
  };

  const handleToggleMusic = async () => {
    if (musicOn) {
      stopMusic();
      setStatus("Music stopped.");
      return;
    }
    await startMusic(musicStyle);
  };

  const onLocalFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const nextTracks = files.map((file) => {
      const url = URL.createObjectURL(file);
      uploadedUrlsRef.current.push(url);
      return { title: file.name.replace(/\.[^/.]+$/, ""), url };
    });
    setLocalTracks((prev) => {
      const merged = [...prev, ...nextTracks];
      if (currentTrackIndex < 0 && merged.length > 0) setCurrentTrackIndex(0);
      return merged;
    });
    setStatus(`${files.length} song(s) added to in-app player.`);
    e.target.value = "";
  };

  const playCurrentSong = async () => {
    const audio = songAudioRef.current;
    if (!audio || currentTrackIndex < 0 || !localTracks[currentTrackIndex]) return;
    audio.src = localTracks[currentTrackIndex].url;
    audio.volume = Math.max(0, Math.min(1, songVolume / 100));
    try {
      await audio.play();
      setStatus(`Playing song: ${localTracks[currentTrackIndex].title}`);
    } catch (_err) {
      setStatus("Song playback blocked. Click play button in player once.");
    }
  };

  const playNextSong = () => {
    if (!localTracks.length) return;
    const next = (currentTrackIndex + 1) % localTracks.length;
    setCurrentTrackIndex(next);
    setTimeout(() => {
      playCurrentSong();
    }, 0);
  };

  const playPrevSong = () => {
    if (!localTracks.length) return;
    const prev = (currentTrackIndex - 1 + localTracks.length) % localTracks.length;
    setCurrentTrackIndex(prev);
    setTimeout(() => {
      playCurrentSong();
    }, 0);
  };

  return (
    <div className={styles.layout}>
      <Sidebar active="mindfulness" onNavigate={onNavigate} onLogout={onLogout} />
      <main className={styles.main}>
        <div className="page-header">
          <div>
            <h1>Mindfulness</h1>
            <p>Calm routines for stress and hormonal balance</p>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Calm Music</div>
          <div className={styles.actions}>
            <button className={`btn ${musicOn ? "btn-primary" : "btn-sage"}`} onClick={handleToggleMusic}>
              {musicOn ? "Stop Music" : "Start Music"}
            </button>
            <select
              className="form-input"
              style={{ maxWidth: 180 }}
              value={musicStyle}
              onChange={(e) => setMusicStyle(e.target.value)}
            >
              {MUSIC_STYLES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <label className={styles.volumeWrap}>
              Volume
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-title">In-App Song Player</div>
          <div className={styles.actions}>
            <label className="btn btn-sage" style={{ cursor: "pointer" }}>
              Add Songs
              <input type="file" accept="audio/*" multiple onChange={onLocalFilesSelected} style={{ display: "none" }} />
            </label>
            <button className="btn btn-ghost" onClick={playPrevSong} disabled={!localTracks.length}>Prev</button>
            <button className="btn btn-primary" onClick={playCurrentSong} disabled={currentTrackIndex < 0}>Play</button>
            <button className="btn btn-ghost" onClick={playNextSong} disabled={!localTracks.length}>Next</button>
            <label className={styles.volumeWrap}>
              Song Volume
              <input
                type="range"
                min="0"
                max="100"
                value={songVolume}
                onChange={(e) => setSongVolume(Number(e.target.value))}
              />
            </label>
          </div>
          <audio ref={songAudioRef} controls className={styles.audioPlayer} />
          {localTracks.length > 0 ? (
            <div className={styles.songList}>
              {localTracks.map((track, idx) => (
                <button
                  key={`${track.title}-${idx}`}
                  className={styles.songBtn}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setTimeout(() => playCurrentSong(), 0);
                  }}
                >
                  {idx === currentTrackIndex ? "Now: " : ""}{track.title}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.status}>Add audio files and play directly here without YouTube.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">Mood-Based Music</div>
          <MoodMusicPlayer />
        </div>

        <div className="card">
          <div className="card-title">Session Timer</div>
          <div className={styles.presetRow}>
            {PRESET_SECONDS.map((s) => (
              <button
                key={s}
                className={`btn ${durationSeconds === s ? "btn-sage" : "btn-ghost"}`}
                onClick={() => pickPreset(s)}
                disabled={isRunning}
              >
                {Math.floor(s / 60)} min
              </button>
            ))}
          </div>

          <div className={styles.timerWrap}>
            <div className={styles.timerText}>{formatTime(secondsLeft)}</div>
            <div className={styles.progressWrap}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={styles.actions}>
            <button className="btn btn-primary" onClick={startTimer} disabled={isRunning}>
              Start
            </button>
            <button className="btn btn-ghost" onClick={pauseTimer} disabled={!isRunning}>
              Pause
            </button>
            <button className="btn btn-ghost" onClick={resetTimer}>
              Reset
            </button>
            <button
              className="btn btn-ghost"
              onClick={requestNotifications}
              disabled={notifyPermission === "granted"}
            >
              {notifyPermission === "granted" ? "Notifications On" : "Enable Notifications"}
            </button>
          </div>

          {status ? <p className={styles.status}>{status}</p> : null}
        </div>

        <div className="card">
          <div className="card-title">Breathing Practice</div>
          <BreathingAnimation />
        </div>
      </main>
    </div>
  );
}
