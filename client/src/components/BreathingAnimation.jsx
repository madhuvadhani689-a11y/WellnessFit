import { useState, useEffect } from "react";
import "./BreathingAnimation.css";

const BREATHING_PHASES = [
  { label: "Inhale", duration: 4 },
  { label: "Hold", duration: 4 },
  { label: "Exhale", duration: 4 },
];

export default function BreathingAnimation() {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BREATHING_PHASES[0].duration);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) {
            return prev - 1;
          }
          const nextIndex = (phaseIndex + 1) % BREATHING_PHASES.length;
          setPhaseIndex(nextIndex);
          if (nextIndex === 0) {
            setCycles((c) => c + 1);
          }
          return BREATHING_PHASES[nextIndex].duration;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, phaseIndex]);

  const currentPhase = BREATHING_PHASES[phaseIndex];

  return (
    <div className="breathing-container">
      <div className={`breathing-circle ${isRunning ? "active" : ""}`}>
        <div className="circle-content">
          <div className="phase-text">{currentPhase.label}</div>
          <div className="time-text">{timeLeft}</div>
        </div>
      </div>

      <div className="cycles-text">Completed breath cycles: {cycles}</div>

      <button
        className="btn start-stop-btn"
        onClick={() => setIsRunning(!isRunning)}
      >
        {isRunning ? "Stop" : "Start"}
      </button>
    </div>
  );
}
