const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { startPeriodReminderJob } = require("./services/periodReminderJob");
const { startWorkoutReminderJob } = require("./services/workoutReminderJob");
const { startCronJobs } = require('./utils/cronJobs');
startCronJobs();
const requestContext = require("./middleware/requestContext");
const requestLogger = require("./middleware/requestLogger");
const { notFound, errorHandler } = require("./middleware/errorHandler");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const app = express();
const PORT = Number(process.env.PORT || 5000);
let databaseReady = false;
const reminderJobEnabled = String(process.env.PERIOD_REMINDER_JOB_ENABLED || "false").toLowerCase() === "true";
const PORT_FALLBACK_SPAN = Math.max(0, Number(process.env.PORT_FALLBACK_SPAN || 10));

const resolveCorsOrigins = () => {
  const configured = (process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const defaults = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://[::1]:5173",
  ];
  return [...new Set([...configured, ...defaults])];
};

const corsOrigins = resolveCorsOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      const isLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin);
      if (isLoopback) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(requestContext);
app.use(requestLogger);

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON body. Please retry your action." });
  }
  return next(err);
});

const requireDatabase = (_req, res, next) => {
  if (!databaseReady) {
    return res.status(503).json({
      message: "Database is unavailable. Start MongoDB or update server/.env with a working MONGODB_URI.",
    });
  }
  return next();
};

app.use("/api/auth", requireDatabase, require("./routes/auth"));
app.use("/api/user", requireDatabase, require("./routes/user"));
app.use("/api/users", requireDatabase, require("./routes/users"));
app.use("/api/trainer", requireDatabase, require("./routes/trainer"));
app.use("/api/weight", requireDatabase, require("./routes/weight"));
app.use("/api/pcod", requireDatabase, require("./routes/pcod"));
app.use("/api/nutrition", requireDatabase, require("./routes/nutrition"));
app.use("/api/workout", requireDatabase, require("./routes/workout"));
app.use("/api/analytics", requireDatabase, require("./routes/analytics"));
app.use("/api/correlation", requireDatabase, require("./routes/correlationRoutes"));
app.use("/api/checkins", requireDatabase, require("./routes/checkin"));
app.use("/api/ai", requireDatabase, require("./routes/aiRoute"));
app.use("/api/clients", requireDatabase, require("./routes/clients"));
app.use("/api/programs", requireDatabase, require("./routes/programs"));
app.use("/api/pcod", requireDatabase, require("./routes/aiInsightRoutes"));
app.use("/api/pcod", requireDatabase, require("./routes/reportRoutes"));
app.use("/api/timeline", requireDatabase, require("./routes/timelineRoutes"));

app.get("/api/health", (_req, res) =>
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "degraded",
    databaseReady,
    message: databaseReady
      ? "WellnessFit API is running"
      : "WellnessFit API is running, but MongoDB is not connected",
  })
);

app.use(notFound);
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("Startup warning: MONGODB_URI is missing in server/.env");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    databaseReady = true;
    console.log("MongoDB connected");
  } catch (err) {
    databaseReady = false;
    console.error("MongoDB connection error:", err.message);
  }
};

mongoose.connection.on("connected", () => {
  databaseReady = true;
});

mongoose.connection.on("disconnected", () => {
  databaseReady = false;
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  databaseReady = false;
  console.error("MongoDB runtime error:", err.message);
});

const isWellnessFitServerRunning = async (port) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: controller.signal });
    if (!res.ok) return false;
    const data = await res.json();
    return typeof data?.message === "string" && data.message.includes("WellnessFit API");
  } catch (_err) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const tryListen = (port) =>
  new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.once("listening", () => resolve(server));
    server.once("error", (err) => reject(err));
  });

const startListening = async (basePort) => {
  for (let offset = 0; offset <= PORT_FALLBACK_SPAN; offset += 1) {
    const candidatePort = basePort + offset;

    if (offset === 0) {
      const duplicateRunning = await isWellnessFitServerRunning(candidatePort);
      if (duplicateRunning) {
        process.exit(0);
        return null;
      }
    }

    try {
      const server = await tryListen(candidatePort);
      process.env.PORT = String(candidatePort);
      console.log(`Server listening on http://localhost:${candidatePort}`);

      server.on("error", (err) => {
        console.error("Runtime server error:", err.message);
      });

      return server;
    } catch (err) {
      const retryable = ["EADDRINUSE", "EACCES", "EADDRNOTAVAIL"].includes(err.code);
      if (retryable && offset < PORT_FALLBACK_SPAN) {
        console.warn(`Port ${candidatePort} unavailable (${err.code}). Trying ${candidatePort + 1}...`);
        continue;
      }

      throw err;
    }
  }

  throw new Error(`Unable to find an available port in range ${basePort}-${basePort + PORT_FALLBACK_SPAN}`);
};

const startServer = async () => {
  await connectDatabase();
  await startListening(PORT);

  if (reminderJobEnabled) {
    startPeriodReminderJob();
  }
  startWorkoutReminderJob();
};

startServer().catch((err) => {
  console.error("Fatal startup error:", err.message);
  process.exit(1);
});
