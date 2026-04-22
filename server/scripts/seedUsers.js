const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe123!";
const RESET_PASSWORDS = process.env.SEED_RESET_PASSWORDS === "true";

const seedUsers = [
  { name: "System Admin", email: "admin@wellnessfit.com", role: "admin", goal: "loss" },
  { name: "Trainer One", email: "trainer1@wellnessfit.com", role: "trainer", goal: "loss" },
  { name: "Trainer Two", email: "trainer2@wellnessfit.com", role: "trainer", goal: "gain" },
  { name: "Trainer Three", email: "trainer3@wellnessfit.com", role: "trainer", goal: "pcod" },
];

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email }).select("+password");

  if (!existing) {
    await User.create({ ...data, password: DEFAULT_PASSWORD });
    console.log(`Created: ${data.email} (${data.role})`);
    return;
  }

  existing.name = data.name;
  existing.role = data.role;
  existing.goal = data.goal;

  if (RESET_PASSWORDS) {
    existing.password = DEFAULT_PASSWORD;
  }

  await existing.save();
  console.log(`Updated: ${data.email} (${data.role})`);
}

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected for seeding users");

  for (const u of seedUsers) {
    await upsertUser(u);
  }

  console.log("Seeding complete");
  console.log(`Default password used: ${DEFAULT_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch (_e) {}
  process.exit(1);
});
