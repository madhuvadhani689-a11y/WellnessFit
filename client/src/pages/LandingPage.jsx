import styles from "./LandingPage.module.css";

export default function LandingPage({ onGetStarted }) {
  return (
    <div className={styles.page}>
      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.logo}>Wellness<span>Fit</span></div>
        <ul className={styles.navLinks}>
          {["Features", "PCOD Care", "Plans", "Stories"].map((l) => (
            <li key={l}><a href="#">{l}</a></li>
          ))}
        </ul>
        <button className="btn btn-primary" onClick={onGetStarted}>Get Started →</button>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className="tag tag-sage" style={{ marginBottom: 22 }}>Your Holistic Health Partner</div>
          <h1 className={styles.heroTitle}>
            Transform Your<br /><em>Wellness Journey</em><br />With Science
          </h1>
          <p className={styles.heroSub}>
            Track weight loss, weight gain, and PCOD symptoms with AI-powered insights.
            Personalised nutrition, cycle tracking, and expert guidance — all in one place.
          </p>
          <div className={styles.heroActions}>
            <button className="btn btn-primary" style={{ padding: "15px 36px", fontSize: "1rem" }} onClick={onGetStarted}>
              Start Free →
            </button>
            <button className="btn btn-ghost" style={{ padding: "15px 24px" }}>▶ Watch Demo</button>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={`card ${styles.mainCard}`}>
            <div className={styles.cardHeader}>
              <span style={{ fontFamily: "var(--font-head)", color: "var(--green)", fontWeight: 700 }}>Weight Progress</span>
              <span className="tag tag-green" style={{ fontSize: ".7rem" }}>On Track 🎯</span>
            </div>
            <div className={styles.bigWeight}>68.4<span> kg</span></div>
            <div style={{ color: "var(--muted)", fontSize: ".82rem", marginBottom: 14 }}>Current · Goal: 62 kg</div>
            <div className="bar-wrap"><div className="bar-fill" style={{ width: "65%", background: "var(--sage)" }} /></div>
            <div className={styles.miniStats}>
              {[["−5.6 kg", "Lost"], ["84", "Days"], ["6 kg", "To Go"]].map(([v, l]) => (
                <div key={l} className={styles.miniStat}>
                  <div className={styles.miniVal}>{v}</div>
                  <div className={styles.miniLbl}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.smallCards}>
            {[
              ["🔥", "Calories", "1,640 / 1,800"],
              ["🌸", "Cycle Day", "Day 14 · Ovulation"],
              ["💪", "Streak",   "12 days 🏆"],
              ["💧", "Water",    "2.1 / 2.5 L"],
            ].map(([icon, t, v]) => (
              <div key={t} className={`card ${styles.smallCard}`}>
                <div className={styles.scIcon}>{icon}</div>
                <div className={styles.scTitle}>{t}</div>
                <div className={styles.scVal}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className={styles.statsBar}>
        {[["50K+","Active Users"],["2.4M","Meals Tracked"],["98%","Satisfaction"],["15+","Nutritionists"]].map(([n, l]) => (
          <div key={l} className={styles.statBarItem}>
            <div className={styles.statBarNum}>{n}</div>
            <div className={styles.statBarLbl}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section className={styles.features}>
        <div className="tag tag-sage">Core Features</div>
        <h2 className="section-title" style={{ marginTop: 14 }}>Everything You Need to Thrive</h2>
        <div className={`${styles.featGrid} grid-3`}>
          {[
            ["⚖️", "#E8F5E4", "Smart Weight Tracking",  "AI pattern detection, plateau alerts, and personalised tips to keep you moving forward."],
            ["🌸", "#FFF0EE", "PCOD / PCOS Tracker",    "Cycle calendar, symptom logging, hormone levels, and phase-aware nutrition advice."],
            ["🥗", "#FFFBEC", "Nutrition Planner",       "1M+ food database, goal-specific meal plans, and macro tracking in real time."],
            ["📊", "#F0F4FF", "Advanced Analytics",      "Beautiful charts, weekly reports, and trend insights to understand your body better."],
            ["🏋️", "#FFF4EC", "Workout Integration",     "Log exercises, sync trackers, and see how workouts affect weight and PCOD symptoms."],
            ["🧘", "#F0FAFA", "Mindfulness & Sleep",     "Track stress, sleep, and mood — key factors in hormonal balance and weight management."],
          ].map(([icon, bg, title, text]) => (
            <div key={title} className={`card ${styles.featCard}`}>
              <div className={styles.featIcon} style={{ background: bg }}>{icon}</div>
              <div className={styles.featTitle}>{title}</div>
              <p className={styles.featText}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PCOD SECTION ── */}
      <section className={styles.pcodSection}>
        <div className={styles.pcodContent}>
          <div className="tag" style={{ background: "rgba(168,196,162,.2)", color: "var(--sage-light)" }}>PCOD Care</div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, margin: "16px 0" }}>
            Designed for Women<br />With PCOD / PCOS
          </h2>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: "1rem", lineHeight: 1.7, marginBottom: 36 }}>
            Finally, a health app that truly understands hormonal health. Track, understand, and manage symptoms with evidence-based tools.
          </p>
          <div className={styles.pcodFeats}>
            {["Cycle & symptom tracking every day","Hormone-friendly, anti-inflammatory meal plans","AI insights tailored to your cycle phase","Community support from women on the same journey"].map((f) => (
              <div key={f} className={styles.pcodFeat}>
                <div className={styles.pcodCheck}>✓</div>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-sage" style={{ marginTop: 36, padding: "14px 32px" }} onClick={onGetStarted}>
            Start PCOD Plan →
          </button>
        </div>

        <div className={`card ${styles.pcodCard}`}>
          <div style={{ color: "rgba(255,255,255,.8)", fontWeight: 600, marginBottom: 4 }}>PCOD Cycle Tracker</div>
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: ".78rem" }}>Priya · February 2026</div>
          <div className={styles.cycleRingWrap}>
            <div className={styles.cycleRing}>
              <div className={styles.cycleInner}>
                <div className={styles.cycleDay}>14</div>
                <div className={styles.cycleLbl}>Day of Cycle</div>
              </div>
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,.55)", fontSize: ".78rem", marginBottom: 8 }}>Today's symptoms</div>
          <div className={styles.symptomChips}>
            {[["Bloating",true],["Fatigue",true],["Mood",false],["Cramps",false],["Acne",true]].map(([s,a]) => (
              <span key={s} className={`${styles.chip} ${a ? styles.chipActive : ""}`}>{s}</span>
            ))}
          </div>
          <div className={styles.aiTip}>
            <span style={{ color: "var(--sage-light)", fontWeight: 700, fontSize: ".78rem" }}>💡 AI Insight</span>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".78rem", marginTop: 4, lineHeight: 1.6 }}>
              You're in your ovulatory phase. Zinc-rich foods like pumpkin seeds may help reduce bloating today.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className={styles.plans}>
        <div className="tag tag-sage">Goal-Based Plans</div>
        <h2 className="section-title" style={{ marginTop: 14 }}>Your Goal, Your Plan</h2>
        <div className={`grid-3 ${styles.plansGrid}`}>
          {[
            { hdr: styles.lossHdr, emoji: "🥗", name: "Weight Loss", desc: "Sustainable, science-backed fat loss", items: ["Calorie deficit meal plans","Weekly weight check-ins","Fat-burning workout guides","Macro tracking dashboard"], btn: "btn-primary", label: "Start Weight Loss" },
            { hdr: styles.pcodHdr, emoji: "🌸", name: "PCOD Management", desc: "Holistic hormonal health", items: ["Cycle & symptom tracking","Phase-based nutrition plans","Stress & sleep monitoring","Specialist consultation"], btn: "btn-sage", label: "Start PCOD Plan", featured: true },
            { hdr: styles.gainHdr, emoji: "💪", name: "Weight Gain", desc: "Healthy muscle & mass building", items: ["High-calorie meal planning","Muscle-building workouts","Protein intake tracking","Body composition analysis"], btn: "btn-primary", label: "Start Weight Gain" },
          ].map(({ hdr, emoji, name, desc, items, btn, label, featured }) => (
            <div key={name} className={`card ${styles.planCard} ${featured ? styles.planFeatured : ""}`}>
              <div className={`${styles.planHdr} ${hdr}`}>
                <span className={styles.planEmoji}>{emoji}</span>
                <div className={styles.planName}>{name}</div>
                <div className={styles.planDesc}>{desc}</div>
                {featured && <span className={styles.featuredBadge}>POPULAR</span>}
              </div>
              <div className={styles.planBody}>
                <ul className={styles.planList}>
                  {items.map((i) => <li key={i}>{i}</li>)}
                </ul>
                <button className={`btn ${btn} btn-full`} onClick={onGetStarted}>{label} →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to Transform Your Health?</h2>
        <p style={{ color: "var(--muted)", marginBottom: 40 }}>Join 50,000+ women who have taken control of their wellness.</p>
        <button className="btn btn-primary" style={{ padding: "16px 44px", fontSize: "1rem" }} onClick={onGetStarted}>
          Start Free Today →
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Wellness<span>Fit</span></div>
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".82rem", marginTop: 8 }}>
          © 2026 WellnessFit · Made with 💚 for your health
        </p>
      </footer>
    </div>
  );
}
