import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from './PCODCompanion.module.css';
import { useAuth } from '../context/AuthContext';

// Custom Queue to manage floating elements, using lhead and ltail instead of head and tail.
class ElementQueue {
  constructor() {
    this.lhead = null;
    this.ltail = null;
  }
  
  enqueue(item) {
    const node = { value: item, next: null };
    if (!this.lhead) {
      this.lhead = node;
      this.ltail = node;
    } else {
      this.ltail.next = node;
      this.ltail = node;
    }
  }
  
  toArray() {
    let current = this.lhead;
    const arr = [];
    while (current) {
      arr.push(current.value);
      current = current.next;
    }
    return arr;
  }
}

const SYMPTOMS = [
  "Poor Sleep", "Cravings", "Low Activity", "Fatigue", 
  "Bloating", "Mood Swings", "Acne", "Insomnia", "Nausea", "Weight Gain", "Back Pain", "Cramps"
];

export default function PCODCompanion({ cycleLogs = [] }) {
  const { apiFetch, user } = useAuth();
  const containerRef = useRef(null);
  const bubbleRefs = useRef([]);
  const requestRef = useRef();
  
  const [selectedSymptoms, setSelectedSymptoms] = useState(new Set());
  const [analysisResult, setAnalysisResult] = useState(null);
  const [cycleAlert, setCycleAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize Physics state once
  const physicsState = useMemo(() => {
    const queue = new ElementQueue();
    SYMPTOMS.forEach((sym, idx) => {
      queue.enqueue({
        id: idx,
        name: sym,
        x: Math.random() * 80 + 10, // percentages to keep them inside
        y: Math.random() * 80 + 10,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 50,
        hovered: false
      });
    });
    return queue.toArray();
  }, []);

  const handleMouseEnter = (idx) => {
    physicsState[idx].hovered = true;
  };

  const handleMouseLeave = (idx) => {
    physicsState[idx].hovered = false;
  };

  const toggleSymptom = (idx) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  useEffect(() => {
    const updatePhysics = () => {
      if (!containerRef.current) {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return;
      }
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      if (width > 0 && height > 0) {
        physicsState.forEach((b, i) => {
          if (!b.hovered) {
            let curX = (b.x / 100) * width;
            let curY = (b.y / 100) * height;

            curX += b.vx * 10;
            curY += b.vy * 10;

            if (curX <= b.radius) { curX = b.radius; b.vx *= -1; }
            if (curX >= width - b.radius) { curX = width - b.radius; b.vx *= -1; }
            if (curY <= b.radius) { curY = b.radius; b.vy *= -1; }
            if (curY >= height - b.radius) { curY = height - b.radius; b.vy *= -1; }

            b.x = (curX / width) * 100;
            b.y = (curY / height) * 100;
          }

          const el = bubbleRefs.current[i];
          if (el) {
            el.style.left = `${b.x}%`;
            el.style.top = `${b.y}%`;
          }
        });
      }

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [physicsState]);

  const handleAnalyze = async () => {
    if (selectedSymptoms.size === 0) return;
    
    setLoading(true);
    const symptomsList = Array.from(selectedSymptoms).map(idx => SYMPTOMS[idx]);
    
    try {
      const res = await apiFetch("/api/pcod/analyze", {
        method: "POST",
        body: JSON.stringify({ symptoms: symptomsList, logs: cycleLogs })
      });
      setAnalysisResult(res.suggestion);
      if (res.cycleAlert) {
        setCycleAlert(res.cycleAlert);
      }
    } catch (err) {
      console.error(err);
      setAnalysisResult({
        trigger: "Unknown",
        message: "Could not analyze symptoms right now. Try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.companionWrapper}>
      <div className={styles.header}>
        <h2>PCOD Companion</h2>
        <p>Select your symptoms from the antigravity field to discover potential root causes.</p>
      </div>

      <div className={styles.container} ref={containerRef}>
        {physicsState.map((bubble, idx) => (
          <div
            key={bubble.name}
            ref={(el) => (bubbleRefs.current[idx] = el)}
            className={`${styles.bubble} ${selectedSymptoms.has(idx) ? styles.selected : ''}`}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={() => handleMouseLeave(idx)}
            onClick={() => toggleSymptom(idx)}
          >
            {bubble.name}
          </div>
        ))}
      </div>

      <div className={styles.actionRow}>
        <button 
          className="btn btn-primary" 
          disabled={selectedSymptoms.size === 0 || loading}
          onClick={handleAnalyze}
        >
          {loading ? "Analyzing..." : "Analyze Symptoms"}
        </button>
      </div>

      {analysisResult && (
        <div className={styles.analysisResult}>
          <h3>Analysis Complete</h3>
          <div className={styles.triggerBadge}>{analysisResult.trigger}</div>
          <p>{analysisResult.message}</p>
        </div>
      )}

      {cycleAlert && (
        <div className={`${styles.alertCard} ${styles.floatingAlert}`}>
          <div className={styles.alertIcon}>⚠️</div>
          <div className={styles.alertText}>
            <h4>Health Check-in</h4>
            <p>{cycleAlert}</p>
          </div>
        </div>
      )}
    </div>
  );
}
