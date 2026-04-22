import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext(null);
const DEV_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AUTH_USER_KEY = "wf_user";
const AUTH_TOKEN_KEY = "wf_token";

const isLoopbackHost = (host) => ["localhost", "127.0.0.1", "::1", "[::1]"].includes(String(host || "").toLowerCase());

const getUserStorageId = (userData) => {
  if (!userData) return "guest";
  return userData._id || userData.email || "guest";
};

const buildApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/")) return path;

  if (typeof window === "undefined") return path;

  try {
    const apiUrl = new URL(DEV_API_BASE);
    const uiHost = window.location.hostname;
    const uiPort = window.location.port || (window.location.protocol === "https:" ? "443" : "80");
    const apiPort = apiUrl.port || (apiUrl.protocol === "https:" ? "443" : "80");

    if (isLoopbackHost(uiHost) && uiPort !== apiPort) {
      return `${DEV_API_BASE}${path}`;
    }
  } catch (_err) {}

  return path;
};

const buildFallbackApiUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      return parsed.toString();
    }
  } catch (_err) {}
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || "");

  const login = useCallback((userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    localStorage.setItem(AUTH_TOKEN_KEY, jwt);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken("");
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }, []);

  const buildScopedKey = useCallback(
    (baseKey, userData = user) => `${baseKey}:${getUserStorageId(userData)}`,
    [user]
  );

  // Centralized fetch wrapper that auto-attaches Bearer token
  const apiFetch = useCallback(
    async (path, options = {}) => {
      const timeoutMs = options.timeoutMs || 15000;
      const url = buildApiUrl(path);
      const makeRequest = async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
          return await fetch(url, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...options.headers,
            },
            signal: options.signal || controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
      };

      let res;
      try {
        res = await makeRequest(url);
      } catch (err) {
        const fallbackUrl = buildFallbackApiUrl(url);
        if (fallbackUrl) {
          try {
            res = await makeRequest(fallbackUrl);
          } catch (_fallbackErr) {
            if (err.name === "AbortError") {
              throw new Error("Request timed out. Check whether the backend server is running.");
            }
            throw new Error(`Failed to connect to the backend. Verify that ${DEV_API_BASE} is running.`);
          }
        } else {
          if (err.name === "AbortError") {
            throw new Error("Request timed out. Check whether the backend server is running.");
          }
          throw new Error(`Failed to connect to the backend. Verify that ${DEV_API_BASE} is running.`);
        }
      }

      if (!res) {
        throw new Error(`Failed to connect to the backend. Verify that ${DEV_API_BASE} is running.`);
      }

      let data = {};
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = text ? { message: text } : {};
      }

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          setToken("");
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        throw new Error(data.message || `Request failed (${res.status})`);
      }

      return data;
    },
    [token, setToken, setUser]
  );

  return <AuthContext.Provider value={{ user, token, login, logout, apiFetch, buildScopedKey }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
