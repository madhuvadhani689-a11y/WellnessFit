const router = require("express").Router();
const User   = require("../models/User");
const { protect, signToken } = require("../middleware/auth");
const { sendEmail } = require("../utils/emailService");

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  goal: user.goal,
  gender: user.gender,
  age: user.age,
  heightCm: user.heightCm,
  startingWeight: user.startingWeight,
  targetWeight: user.targetWeight,
  activityLevel: user.activityLevel,
  whatsappNumber: user.whatsappNumber,
  trainerProfile: user.trainerProfile,
  preferences: user.preferences,
  periodReminder: user.periodReminder,
});

const stripUndefined = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return value;
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      goal,
      gender,
      age,
      heightCm,
      startingWeight,
      targetWeight,
      whatsappNumber,
      role,
      trainerProfile,
      preferences,
    } = req.body;
    const normalizedRole = role === "trainer" ? "trainer" : "user";

    if (role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be created from public sign up" });
    }

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already in use" });

    const trainerFields =
      normalizedRole === "trainer"
        ? {
            trainerProfile: {
              specialization: trainerProfile?.specialization || "",
              experienceYears: Number(trainerProfile?.experienceYears || 0),
              certifications: trainerProfile?.certifications || "",
              clientCapacity: Number(trainerProfile?.clientCapacity || 0),
            },
          }
        : {};

    const user = await User.create({
      name,
      email,
      password,
      goal,
      role: normalizedRole,
      age,
      heightCm,
      startingWeight,
      targetWeight,
      gender,
      whatsappNumber,
      preferences,
      ...trainerFields,
    });

    sendEmail(
      email,
      "Welcome to WellnessFit! 🌱",
      `<div style="font-family:Arial;max-width:500px;margin:auto;padding:24px;background:#faf9f6;">
        <h2 style="color:#3d5a3e;">Welcome, ${name}!</h2>
        <p>We're thrilled to be part of your wellness journey.</p>
        <p>Log in to customize your plan and explore your dashboard.</p>
      </div>`
    ).catch(() => {});

    res.status(201).json({
      token: signToken(user._id),
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/demo
router.post("/demo", async (_req, res) => {
  try {
    const demoEmail = "demo@wellnessfit.com";
    const demoPassword = process.env.DEMO_USER_PASSWORD || "DemoPass123!";

    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      user = await User.create({
        name: "WellnessFit Demo",
        email: demoEmail,
        password: demoPassword,
        role: "user",
        goal: "pcod",
      });
    }

    res.json({
      token: signToken(user._id),
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid email or password" });

    if (role && user.role !== role) {
      return res.status(403).json({ message: `This account belongs to ${user.role}. Use the correct portal.` });
    }

    if (user.emailNotifications !== false) {
      sendEmail(
        user.email,
        "🔒 New Login Alert - WellnessFit",
        `<div style="font-family:Arial;max-width:500px;margin:auto;padding:24px;background:#faf9f6;">
          <h2 style="color:#3d5a3e;">WellnessFit 🌿</h2>
          <p>Hi ${user.name},</p>
          <p>A successful login was just detected on your account.</p>
          <p>If this was you, you can safely ignore this email.</p>
        </div>`
      ).catch(() => {});
    }

    res.json({
      token: signToken(user._id),
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me  (protected)
router.get("/me", protect, (req, res) => res.json({ user: serializeUser(req.user) }));

// PUT /api/auth/profile  (protected)
router.put("/profile", protect, async (req, res) => {
  try {
    const allowed = [
      "name",
      "goal",
      "gender",
      "age",
      "heightCm",
      "targetWeight",
      "activityLevel",
      "whatsappNumber",
      "preferences",
      "periodReminder",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (req.body.periodReminder) {
      const input = req.body.periodReminder;
      const existingChannels = req.user.periodReminder?.channels || {};
      updates.periodReminder = {
        enabled: input.enabled === true,
        leadDays: Array.isArray(input.leadDays)
          ? input.leadDays.map((value) => Number(value)).filter((value) => !Number.isNaN(value)).slice(0, 3)
          : [1],
        channels: {
          email: input.channels?.email ?? existingChannels.email ?? true,
          whatsapp: input.channels?.whatsapp ?? existingChannels.whatsapp ?? false,
        },
      };
    }
    if (req.user.role === "trainer" && req.body.trainerProfile) {
      updates.trainerProfile = {
        specialization: req.body.trainerProfile.specialization || "",
        experienceYears: Number(req.body.trainerProfile.experienceYears || 0),
        certifications: req.body.trainerProfile.certifications || "",
        clientCapacity: Number(req.body.trainerProfile.clientCapacity || 0),
      };
    }
    const sanitizedUpdates = stripUndefined(updates);
    const user = await User.findByIdAndUpdate(req.user._id, sanitizedUpdates, { new: true });
    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
