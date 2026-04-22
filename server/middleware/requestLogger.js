const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const payload = {
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (res.statusCode >= 500) {
      console.error("[api]", payload);
    } else if (res.statusCode >= 400) {
      console.warn("[api]", payload);
    } else {
      console.log("[api]", payload);
    }
  });

  next();
};

module.exports = requestLogger;

