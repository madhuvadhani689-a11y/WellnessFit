import "./index.css";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import Dashboard from "./pages/Dashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import WeightTracker from "./pages/WeightTracker";
import PCODTracker from "./pages/PCODTracker";
import NutritionPlanner from "./pages/NutritionPlanner";
import Analytics from "./pages/Analytics";
import Mindfulness from "./pages/Mindfulness";
import Settings from "./pages/Settings";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import RecipesPage from "./pages/RecipesPage";
import TrainerDesk from "./pages/TrainerDesk";
import ClientManagement from "./pages/ClientManagement";
import Programs from "./pages/Programs";
import TrainerSettings from "./pages/TrainerSettings";
import ClientDetail from "./pages/ClientDetail";

const PAGES = {
  landing: LandingPage,
  auth: Auth,
  admin_auth: AdminAuth,
  dashboard: Dashboard,
  trainer_dashboard: TrainerDashboard,
  admin_dashboard: AdminDashboard,
  weight: WeightTracker,
  pcod: PCODTracker,
  nutrition: NutritionPlanner,
  analytics: Analytics,
  mindfulness: Mindfulness,
  settings: Settings,
  workout: WorkoutPlanner,
  recipes: RecipesPage,
  client_detail: ClientDetail,
};

const parseHHMM = (value) => {
  const match = String(value || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
};

const canUseBrowserNotifications = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  typeof Notification !== "undefined" &&
  Notification.permission === "granted";

const fireNotification = (title, body) => {
  if (!canUseBrowserNotifications()) return false;
  try {
    new Notification(title, { body });
    return true;
  } catch (_err) {
    return false;
  }
};

function GlobalReminderRunner() {
  const { user, buildScopedKey } = useAuth();

  useEffect(() => {
    if (!user) return undefined;

    const notifications = user.preferences?.notifications || {};
    const workoutEnabledKey = buildScopedKey("wf_reminder_enabled");
    const workoutTimeKey = buildScopedKey("wf_reminder_time");
    const workoutSentKey = buildScopedKey("wf_reminder_last_sent");
    const mealSentKey = buildScopedKey("wf_global_meal_last_sent");

    const checkAndNotify = () => {
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      const workoutEnabledOverride = localStorage.getItem(workoutEnabledKey);
      const workoutTimeOverride = localStorage.getItem(workoutTimeKey);

      const workoutEnabled =
        workoutEnabledOverride == null
          ? notifications.workoutEnabled === true
          : workoutEnabledOverride === "true";
      const workoutTime = workoutTimeOverride || notifications.workoutTime || "18:00";
      const mealEnabled = notifications.mealEnabled === true;
      const mealTime = notifications.mealTime || "13:00";

      const workoutClock = parseHHMM(workoutTime);
      if (
        workoutEnabled &&
        workoutClock &&
        now.getHours() === workoutClock.hours &&
        now.getMinutes() === workoutClock.minutes &&
        localStorage.getItem(workoutSentKey) !== todayKey
      ) {
        const sent = fireNotification(
          "Workout Reminder",
          "Your scheduled workout time is now. Open Workout Planner to start."
        );
        if (sent) localStorage.setItem(workoutSentKey, todayKey);
      }

      const mealClock = parseHHMM(mealTime);
      if (
        mealEnabled &&
        mealClock &&
        now.getHours() === mealClock.hours &&
        now.getMinutes() === mealClock.minutes &&
        localStorage.getItem(mealSentKey) !== todayKey
      ) {
        const sent = fireNotification(
          "Meal Reminder",
          "Meal reminder: log your food to stay on track today."
        );
        if (sent) localStorage.setItem(mealSentKey, todayKey);
      }
    };

    checkAndNotify();
    const timer = window.setInterval(checkAndNotify, 15000);
    return () => window.clearInterval(timer);
  }, [user, buildScopedKey]);

  return null;
}

function Router() {
  const { user, logout } = useAuth();
  const getPublicPageFromHash = () => (window.location.hash === "#admin-login" ? "admin_auth" : "landing");
  const getHomePage = (currentUser) => {
    if (!currentUser) return "landing";
    if (currentUser.role === "trainer") return "trainer_dashboard";
    if (currentUser.role === "admin") return "admin_dashboard";
    return "dashboard";
  };

  const [page, setPage] = useState(user ? getHomePage(user) : getPublicPageFromHash());

  const go = (p) => {
    let nextPage = p;
    if (user?.role === "trainer" && p === "analytics") {
      nextPage = "trainer_dashboard";
    }
    if (p === "pcod" && user) {
      const canAccessPCOD = !user?.gender || user?.gender === 'female' || user?.gender === 'prefer_not_to_say';
      if (!canAccessPCOD) {
        nextPage = "dashboard";
      }
    }

    setPage(nextPage);
    if (nextPage === "admin_auth") {
      window.location.hash = "admin-login";
    } else if (!user && window.location.hash === "#admin-login") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  };
  
  let Page = PAGES[page] || LandingPage;
  if (page === "pcod" && user) {
    const canAccessPCOD = !user?.gender || user?.gender === 'female' || user?.gender === 'prefer_not_to_say';
    if (!canAccessPCOD) {
      Page = Dashboard;
    }
  }

  if (user?.role === "trainer") {
    if (page === "trainer_dashboard") Page = TrainerDesk;
    if (page === "clients") Page = ClientManagement;
    if (page === "workout") Page = Programs;
    if (page === "settings") Page = TrainerSettings;
    if (page === "client_detail") Page = ClientDetail;
  }

  useEffect(() => {
    const handleHashChange = () => {
      if (!user) {
        setPage(getPublicPageFromHash());
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user]);

  useEffect(() => {
    setPage((currentPage) => {
      if (!user && currentPage !== "landing" && currentPage !== "auth" && currentPage !== "admin_auth") {
        return getPublicPageFromHash();
      }

      if (user && (currentPage === "landing" || currentPage === "auth" || currentPage === "admin_auth")) {
        return getHomePage(user);
      }

      return currentPage;
    });
  }, [user]);

  return (
    <>
      <GlobalReminderRunner />
      <Page
        onNavigate={go}
        onLogout={() => {
          logout();
          go(getPublicPageFromHash());
        }}
        onGetStarted={() => go("auth")}
        onLogin={(loggedInUser) => go(getHomePage(loggedInUser || user))}
        onBack={() => go(getHomePage(user))}
      />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem("wf_theme") || "garden";
      document.documentElement.setAttribute("data-theme", theme);
    };

    applyTheme();
    window.addEventListener("storage", applyTheme);
    return () => window.removeEventListener("storage", applyTheme);
  }, []);

  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
