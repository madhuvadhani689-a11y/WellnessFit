import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../context/AuthContext";
import styles from "./WeeklyNutritionReport.module.css";

export default function WeeklyNutritionReport({ onClose }) {
  const { apiFetch, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        // User ID is accessible in backend through auth middleware, but we pass it anyway.
        const res = await apiFetch(`/api/nutrition/weekly-report/${user?._id || "me"}`);
        setData(res);
      } catch (err) {
        setError(err.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [apiFetch, user?._id]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Weekly Nutrition Report</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className={styles.skeleton}>
            <div className={styles.skeletonChart}></div>
            <div className={styles.skeletonGrid}>
              {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeletonCard}></div>)}
            </div>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : !data || data.validDays === 0 ? (
          <div className={styles.empty}>Start logging to see your weekly report!</div>
        ) : (
          <div className={styles.content}>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="calories" fill="var(--green)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg Calories</div>
                <div className={styles.statValue}>{data.avg.calories} <span className={styles.statUnit}>kcal</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg Protein</div>
                <div className={styles.statValue}>{data.avg.protein} <span className={styles.statUnit}>g</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Goal Met Days</div>
                <div className={styles.statValue}>{data.daysMet} <span className={styles.statUnit}>/ 7</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Top Food</div>
                <div className={styles.statValue} style={{ fontSize: "1rem" }}>{data.topFood || "-"}</div>
              </div>
            </div>

            <div className={styles.insights}>
              {data.bestDay && (
                <div className={styles.insightLine}>
                  🎉 Your best day was <strong>{new Date(data.bestDay).toLocaleDateString("en-US", { weekday: "long" })}</strong>!
                </div>
              )}
              <div className={styles.insightLine}>
                {data.daysMet >= 5
                  ? `You hit your calorie goal ${data.daysMet}/7 days — great consistency!`
                  : `You met your goal ${data.daysMet} day${data.daysMet === 1 ? '' : 's'} this week. Let's aim for more next week!`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
