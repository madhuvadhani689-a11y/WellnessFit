import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./WellnessTimeline.module.css";

export default function WellnessTimeline() {
  const { user, apiFetch } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchTimeline = async (pageToFetch) => {
    try {
      if (pageToFetch === 1) setLoading(true);
      const res = await apiFetch(`/api/timeline/${user._id}?page=${pageToFetch}`);
      
      // If error from backend structure catching it inside apiFetch?
      if (!res || !Array.isArray(res.events)) {
        if (pageToFetch === 1) {
          setEvents([]);
        }
        setHasMore(false);
        return;
      }
      
      if (pageToFetch === 1) {
        setEvents(res.events);
      } else {
        setEvents(prev => [...prev, ...res.events]);
      }
      
      setHasMore(res.page < res.pages);
      setError(false);
    } catch(err) {
      console.error(err);
      if (pageToFetch === 1) setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
       fetchTimeline(1);
       setPage(1);
    }
  }, [user]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTimeline(nextPage);
  };

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") return events;
    return events.filter(e => {
      if (activeFilter === "Weight" && e.type.includes('weight')) return true;
      if (activeFilter === "Cycle" && (e.type === 'period_start' || e.type === 'symptom_free')) return true;
      if (activeFilter === "Nutrition" && e.type === 'goal_met') return true;
      return false;
    });
  }, [events, activeFilter]);

  const groupedByMonth = useMemo(() => {
    const grouped = {};
    filteredEvents.forEach(e => {
      const d = new Date(e.date);
      const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });
    return grouped;
  }, [filteredEvents]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Timeline unavailable</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        {["All", "Weight", "Cycle", "Nutrition"].map(f => (
          <div 
            key={f}
            className={`${styles.tab} ${activeFilter === f ? styles.active : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </div>
        ))}
      </div>

      {loading && page === 1 ? (
        <div className={styles.timeline}>
          {[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonEvent} />)}
        </div>
      ) : events.length === 0 ? (
        <div className={styles.empty}>Keep logging to build your timeline! 🌿</div>
      ) : (
        <>
          <div className={styles.timeline}>
            {Object.keys(groupedByMonth).map(month => (
              <div key={month} className={styles.monthGroup}>
                <div className={styles.monthHeader}>{month}</div>
                {groupedByMonth[month].map((event, i) => {
                  const d = new Date(event.date);
                  return (
                    <div key={`${event.type}-${i}`} className={styles.event}>
                      <div className={styles.dot} style={{ backgroundColor: event.color }} />
                      <div className={styles.eventContent}>
                        <div className={styles.icon}>{event.icon}</div>
                        <div className={styles.details}>
                          <span className={styles.date}>{d.toLocaleDateString([], { month: 'short', day: 'numeric'})}</span>
                          <span className={styles.text}>{event.text}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {hasMore && (
            <button className={styles.loadMoreBtn} onClick={loadMore} disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
