const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Attach user to req if token is valid
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ message: "No token – unauthorised" });

  try {
    const decoded = jwt.verify(
      auth.split(" ")[1],
      process.env.JWT_SECRET
    );
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  }
  next();
};

module.exports = { protect, signToken, authorize };
