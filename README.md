# 🌿 WellnessFit — Fresh Start Guide

## Your Folder Structure
```
wellnessfit/
├── package.json          ← root (concurrently)
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css          ← global design tokens
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── Sidebar.module.css
│       └── pages/
│           ├── LandingPage.jsx + .module.css
│           ├── Auth.jsx        + .module.css
│           ├── Dashboard.jsx   + .module.css
│           ├── WeightTracker.jsx   + .module.css
│           ├── PCODTracker.jsx     + .module.css
│           └── NutritionPlanner.jsx + .module.css
└── server/
    ├── .env
    ├── package.json
    ├── index.js
    ├── middleware/auth.js
    ├── models/
    │   ├── User.js
    │   ├── WeightLog.js
    │   ├── PCODLog.js
    │   └── NutritionLog.js
    └── routes/
        ├── auth.js
        ├── weight.js
        ├── pcod.js
        └── nutrition.js
```

---

## ⚡ Start Commands (packages already installed)

### Option A — Run both together from root
```bash
cd wellnessfit
npm run dev
```

### Option B — Run separately
```bash
# Terminal 1
cd wellnessfit/server
npm run dev       # nodemon → http://localhost:5000

# Terminal 2
cd wellnessfit/client
npm run dev       # vite   → http://localhost:5173
```

---

## 🔑 First-time setup checklist

1. **Edit `server/.env`** — swap MongoDB URI if using Atlas:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wellnessfit
   JWT_SECRET=change_this_to_something_random
   ```

2. **Make sure MongoDB is running locally** (if not using Atlas):
   ```bash
   mongod --dbpath /data/db
   ```

3. **Open browser** → `http://localhost:5173`

4. **Try Demo Account** (no MongoDB needed) — click "Try Demo Account" on the Auth page.

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Current user (protected) |
| PUT  | `/api/auth/profile` | Update profile |
| POST | `/api/weight` | Log weight |
| GET  | `/api/weight?period=1M` | Weight history |
| DELETE | `/api/weight/:id` | Delete log |
| POST | `/api/pcod` | Log PCOD symptoms |
| GET  | `/api/pcod` | Logs + cycle info |
| GET  | `/api/pcod/insights` | Pattern insights |
| GET  | `/api/nutrition/today` | Today's meal log |
| POST | `/api/nutrition/food` | Add food to meal |
| PUT  | `/api/nutrition/water` | Update water intake |
| GET  | `/api/nutrition/history` | Past 7 days |
| GET  | `/api/nutrition/meal-plan` | Goal-based plan |

---

## 🎨 Design System

All CSS variables are in `client/src/index.css`:

| Variable | Value | Used for |
|----------|-------|----------|
| `--green` | `#2D4A2F` | Primary colour |
| `--sage` | `#7C9A7E` | Accents |
| `--cream` | `#FAF7F2` | Page background |
| `--blush` | `#E8B4A0` | PCOD / warm |
| `--gold` | `#C9A84C` | Highlights |

Typography: **Playfair Display** (headings) + **DM Sans** (body)

---

## 🗂 Pages Overview

| Page | Route (state) | Features |
|------|--------------|---------|
| Landing | `landing` | Hero, features, PCOD section, plans, CTA |
| Auth | `auth` | Login / Register, goal selector, demo login |
| Dashboard | `dashboard` | Stats, weight chart, rings, meals, PCOD, workouts |
| Weight Tracker | `weight` | Chart, log form, BMI, history, goal progress |
| PCOD Tracker | `pcod` | Calendar, hormone bars, symptom log, AI insights |
| Nutrition | `nutrition` | Macros, meal plan, water cups, micronutrients |

All pages use **CSS Modules** — styles are scoped per file, no conflicts.
