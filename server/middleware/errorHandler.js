const notFound = (req, res, next) => {
  const err = new Error("Route not found");
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, _next) => {
  const status = Number(err.status || err.statusCode || 500);
  const message = err.message || "Server error";
  const requestId = req.requestId || null;

  if (status >= 500) {
    console.error("[error]", { requestId, status, message, stack: err.stack });
  }

  res.status(status).json({ message, requestId });
};

module.exports = { notFound, errorHandler };

