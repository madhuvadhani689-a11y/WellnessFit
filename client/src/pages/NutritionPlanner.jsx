import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import WeeklyNutritionReport from "../components/WeeklyNutritionReport";
import styles from "./NutritionPlanner.module.css";

const MEALS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "snack", label: "Snack" },
  { key: "dinner", label: "Dinner" },
];

const CATEGORIES = [
  { key: "protein", label: "Protein", color: "var(--sage)" },
  { key: "carbs", label: "Carbs", color: "var(--gold)" },
  { key: "vegetables", label: "Vegetables", color: "#6fa56f" },
  { key: "fruits", label: "Fruits", color: "var(--blush)" },
  { key: "dairy", label: "Dairy", color: "#5BA4CF" },
  { key: "healthy_fats", label: "Healthy Fats", color: "#8B5E3C" },
  { key: "indian", label: "Indian 🇮🇳", color: "#FF9933" },
];

const FOOD_LIBRARY = {
  protein: [
    { name: "Egg Whites", unit: "serving", calories: 85, protein: 18, carbs: 1, fats: 0, fiber: 0 },
    { name: "Chicken Breast", unit: "100g", calories: 165, protein: 31, carbs: 0, fats: 4, fiber: 0 },
    { name: "Paneer", unit: "100g", calories: 265, protein: 18, carbs: 6, fats: 20, fiber: 0 },
    { name: "Tofu", unit: "100g", calories: 144, protein: 15, carbs: 3, fats: 8, fiber: 2 },
    { name: "Boiled Eggs", unit: "2 pieces", calories: 140, protein: 12, carbs: 1, fats: 10, fiber: 0 },
    { name: "Fish Fillet", unit: "100g", calories: 140, protein: 24, carbs: 0, fats: 5, fiber: 0 },
    { name: "Moong Dal", unit: "1 cup", calories: 212, protein: 14, carbs: 38, fats: 1, fiber: 15 },
    { name: "Chickpeas", unit: "1 cup", calories: 269, protein: 15, carbs: 45, fats: 4, fiber: 12 },
  ],
  carbs: [
    { name: "Brown Rice", unit: "cup", calories: 215, protein: 5, carbs: 45, fats: 2, fiber: 3 },
    { name: "Oats", unit: "cup", calories: 150, protein: 5, carbs: 27, fats: 3, fiber: 4 },
    { name: "Whole Wheat Roti", unit: "piece", calories: 120, protein: 3, carbs: 21, fats: 3, fiber: 3 },
    { name: "Quinoa", unit: "1 cup", calories: 222, protein: 8, carbs: 39, fats: 4, fiber: 5 },
    { name: "Sweet Potato", unit: "150g", calories: 135, protein: 2, carbs: 31, fats: 0, fiber: 5 },
    { name: "Idli", unit: "3 pieces", calories: 174, protein: 6, carbs: 36, fats: 1, fiber: 2 },
    { name: "Dosa", unit: "2 pieces", calories: 266, protein: 6, carbs: 42, fats: 7, fiber: 2 },
    { name: "Millet Upma", unit: "1 bowl", calories: 230, protein: 6, carbs: 38, fats: 5, fiber: 4 },
  ],
  vegetables: [
    { name: "Broccoli", unit: "cup", calories: 55, protein: 4, carbs: 11, fats: 0, fiber: 5 },
    { name: "Spinach", unit: "cup", calories: 23, protein: 3, carbs: 4, fats: 0, fiber: 2 },
    { name: "Mixed Salad", unit: "bowl", calories: 80, protein: 3, carbs: 10, fats: 3, fiber: 4 },
    { name: "Carrot Beans Poriyal", unit: "1 cup", calories: 95, protein: 3, carbs: 12, fats: 4, fiber: 4 },
    { name: "Cauliflower Stir Fry", unit: "1 cup", calories: 72, protein: 3, carbs: 9, fats: 3, fiber: 4 },
    { name: "Cucumber Salad", unit: "1 bowl", calories: 40, protein: 1, carbs: 7, fats: 1, fiber: 2 },
    { name: "Bottle Gourd Curry", unit: "1 cup", calories: 68, protein: 2, carbs: 9, fats: 3, fiber: 3 },
    { name: "Ladyfinger Masala", unit: "1 cup", calories: 110, protein: 3, carbs: 14, fats: 5, fiber: 4 },
  ],
  fruits: [
    { name: "Banana", unit: "piece", calories: 105, protein: 1, carbs: 27, fats: 0, fiber: 3 },
    { name: "Apple", unit: "piece", calories: 95, protein: 0, carbs: 25, fats: 0, fiber: 4 },
    { name: "Papaya", unit: "cup", calories: 62, protein: 1, carbs: 16, fats: 0, fiber: 3 },
    { name: "Orange", unit: "1 medium", calories: 62, protein: 1, carbs: 15, fats: 0, fiber: 3 },
    { name: "Guava", unit: "1 fruit", calories: 68, protein: 3, carbs: 14, fats: 1, fiber: 5 },
    { name: "Watermelon", unit: "2 cups", calories: 80, protein: 2, carbs: 20, fats: 0, fiber: 1 },
    { name: "Pomegranate", unit: "1 cup", calories: 144, protein: 3, carbs: 32, fats: 2, fiber: 7 },
    { name: "Mango", unit: "1 cup", calories: 99, protein: 1, carbs: 25, fats: 1, fiber: 3 },
  ],
  dairy: [
    { name: "Greek Yogurt", unit: "cup", calories: 130, protein: 11, carbs: 7, fats: 5, fiber: 0 },
    { name: "Milk", unit: "cup", calories: 103, protein: 8, carbs: 12, fats: 2, fiber: 0 },
    { name: "Buttermilk", unit: "glass", calories: 90, protein: 4, carbs: 10, fats: 3, fiber: 0 },
    { name: "Curd", unit: "1 cup", calories: 98, protein: 5, carbs: 7, fats: 5, fiber: 0 },
    { name: "Low-Fat Paneer", unit: "100g", calories: 180, protein: 20, carbs: 5, fats: 8, fiber: 0 },
    { name: "Lassi", unit: "1 glass", calories: 160, protein: 6, carbs: 20, fats: 6, fiber: 0 },
    { name: "Cheese Slice", unit: "2 slices", calories: 140, protein: 8, carbs: 2, fats: 11, fiber: 0 },
  ],
  healthy_fats: [
    { name: "Almonds", unit: "30g", calories: 170, protein: 6, carbs: 6, fats: 15, fiber: 4 },
    { name: "Walnuts", unit: "30g", calories: 185, protein: 4, carbs: 4, fats: 18, fiber: 2 },
    { name: "Peanut Butter", unit: "tbsp", calories: 95, protein: 4, carbs: 3, fats: 8, fiber: 1 },
    { name: "Cashews", unit: "30g", calories: 165, protein: 5, carbs: 9, fats: 13, fiber: 1 },
    { name: "Pistachios", unit: "30g", calories: 160, protein: 6, carbs: 8, fats: 13, fiber: 3 },
    { name: "Flax Seeds", unit: "1 tbsp", calories: 55, protein: 2, carbs: 3, fats: 4, fiber: 3 },
    { name: "Chia Seeds", unit: "1 tbsp", calories: 58, protein: 2, carbs: 5, fats: 4, fiber: 5 },
    { name: "Avocado", unit: "half fruit", calories: 120, protein: 2, carbs: 6, fats: 11, fiber: 5 },
  ],
  indian: [
    { subCategory: "Breakfast", name: "Idli (இட்லி)", unit: "3 pieces", calories: 174, protein: 6, carbs: 36, fats: 1, fiber: 2 },
    { subCategory: "Breakfast", name: "Dosa (தோசை)", unit: "2 pieces", calories: 266, protein: 6, carbs: 42, fats: 7, fiber: 2 },
    { subCategory: "Breakfast", name: "Upma (உப்புமா)", unit: "1 bowl", calories: 230, protein: 6, carbs: 38, fats: 5, fiber: 4 },
    { subCategory: "Breakfast", name: "Pongal (பொங்கல்)", unit: "1 cup", calories: 212, protein: 5, carbs: 30, fats: 8, fiber: 2 },
    { subCategory: "Breakfast", name: "Puttu (புட்டு)", unit: "1 cup", calories: 180, protein: 4, carbs: 38, fats: 1, fiber: 2 },
    { subCategory: "Breakfast", name: "Appam (ஆப்பம்)", unit: "2 pieces", calories: 150, protein: 3, carbs: 32, fats: 1, fiber: 1 },
    { subCategory: "Breakfast", name: "Parotta (பரோட்டா)", unit: "1 piece", calories: 330, protein: 7, carbs: 45, fats: 14, fiber: 2 },
    { subCategory: "Breakfast", name: "Chapati (சப்பாத்தி)", unit: "2 pieces", calories: 140, protein: 4, carbs: 28, fats: 2, fiber: 4 },
    { subCategory: "Breakfast", name: "Poha (அவல்)", unit: "1 bowl", calories: 200, protein: 4, carbs: 40, fats: 3, fiber: 2 },
    { subCategory: "Rice dishes", name: "White Rice (சாதம்)", unit: "1 cup", calories: 205, protein: 4, carbs: 45, fats: 0, fiber: 1 },
    { subCategory: "Rice dishes", name: "Brown Rice (கைகுத்தல் அரிசி)", unit: "1 cup", calories: 215, protein: 5, carbs: 45, fats: 2, fiber: 3 },
    { subCategory: "Rice dishes", name: "Lemon Rice (எலுமிச்சை சாதம்)", unit: "1 cup", calories: 250, protein: 4, carbs: 46, fats: 6, fiber: 2 },
    { subCategory: "Rice dishes", name: "Curd Rice (தயிர் சாதம்)", unit: "1 cup", calories: 220, protein: 6, carbs: 35, fats: 7, fiber: 1 },
    { subCategory: "Rice dishes", name: "Biryani (பிரியாணி)", unit: "1 cup", calories: 350, protein: 12, carbs: 45, fats: 14, fiber: 2 },
    { subCategory: "Rice dishes", name: "Fried Rice (ப்ரைட் ரைஸ்)", unit: "1 cup", calories: 320, protein: 6, carbs: 50, fats: 10, fiber: 3 },
    { subCategory: "Curries", name: "Sambar (சாம்பார்)", unit: "1 cup", calories: 130, protein: 6, carbs: 20, fats: 3, fiber: 4 },
    { subCategory: "Curries", name: "Rasam (ரசம்)", unit: "1 cup", calories: 60, protein: 1, carbs: 10, fats: 2, fiber: 1 },
    { subCategory: "Curries", name: "Dal (பருப்பு)", unit: "1 cup", calories: 150, protein: 9, carbs: 25, fats: 2, fiber: 8 },
    { subCategory: "Curries", name: "Rajma (ராஜ்மா)", unit: "1 cup", calories: 240, protein: 12, carbs: 35, fats: 6, fiber: 10 },
    { subCategory: "Curries", name: "Chole (சென்னா மசாலா)", unit: "1 cup", calories: 220, protein: 10, carbs: 30, fats: 8, fiber: 8 },
    { subCategory: "Curries", name: "Palak Paneer (பாலக் பன்னீர்)", unit: "1 cup", calories: 250, protein: 12, carbs: 10, fats: 18, fiber: 4 },
    { subCategory: "Curries", name: "Chicken Curry (சிக்கன் குழம்பு)", unit: "1 cup", calories: 280, protein: 25, carbs: 8, fats: 16, fiber: 1 },
    { subCategory: "Curries", name: "Fish Curry (மீன் குழம்பு)", unit: "1 cup", calories: 240, protein: 20, carbs: 6, fats: 15, fiber: 1 },
    { subCategory: "Sides", name: "Coconut Chutney (தேங்காய் சட்னி)", unit: "2 tbsp", calories: 80, protein: 1, carbs: 3, fats: 7, fiber: 2 },
    { subCategory: "Sides", name: "Tomato Chutney (தக்காளி சட்னி)", unit: "2 tbsp", calories: 40, protein: 1, carbs: 6, fats: 2, fiber: 1 },
    { subCategory: "Sides", name: "Pickle (ஊறுகாய்)", unit: "1 tbsp", calories: 30, protein: 0, carbs: 2, fats: 3, fiber: 0 },
    { subCategory: "Sides", name: "Papad (அப்பளம்)", unit: "1 piece", calories: 45, protein: 2, carbs: 8, fats: 1, fiber: 1 },
    { subCategory: "Sides", name: "Raita (ரெய்தா)", unit: "0.5 cup", calories: 50, protein: 3, carbs: 6, fats: 2, fiber: 0 },
    { subCategory: "Snacks", name: "Murukku (முறுக்கு)", unit: "2 pieces", calories: 150, protein: 2, carbs: 20, fats: 8, fiber: 1 },
    { subCategory: "Snacks", name: "Bajji (பஜ்ஜி)", unit: "2 pieces", calories: 220, protein: 4, carbs: 25, fats: 12, fiber: 2 },
    { subCategory: "Snacks", name: "Bonda (போண்டா)", unit: "2 pieces", calories: 200, protein: 5, carbs: 22, fats: 10, fiber: 2 },
    { subCategory: "Snacks", name: "Vada (வடை)", unit: "2 pieces", calories: 180, protein: 6, carbs: 20, fats: 8, fiber: 3 },
    { subCategory: "Snacks", name: "Sundal (சுண்டல்)", unit: "1 cup", calories: 160, protein: 9, carbs: 28, fats: 2, fiber: 8 },
    { subCategory: "Drinks", name: "Buttermilk (மோர்)", unit: "1 glass", calories: 40, protein: 3, carbs: 5, fats: 1, fiber: 0 },
    { subCategory: "Drinks", name: "Filter Coffee (பில்டர் காபி)", unit: "1 cup", calories: 70, protein: 2, carbs: 8, fats: 3, fiber: 0 },
    { subCategory: "Drinks", name: "Masala Chai (மசாலா டீ)", unit: "1 cup", calories: 85, protein: 2, carbs: 12, fats: 3, fiber: 0 },
    { subCategory: "Drinks", name: "Lassi (லஸ்ஸி)", unit: "1 glass", calories: 160, protein: 6, carbs: 20, fats: 6, fiber: 0 },
    { subCategory: "Drinks", name: "Tender Coconut (இளநீர்)", unit: "1 cup", calories: 45, protein: 0, carbs: 11, fats: 0, fiber: 0 },
  ],
};

const SWAP_LIBRARY = {
  oats: { name: "Vegetable Poha", portion: "1.5 cups cooked", calories: 320 },
  yoghurt: { name: "Low-fat Curd Bowl", portion: "1 cup", calories: 180 },
  yogurt: { name: "Low-fat Curd Bowl", portion: "1 cup", calories: 180 },
  rice: { name: "Quinoa", portion: "1 cup cooked", calories: 220 },
  chicken: { name: "Paneer Tikka", portion: "120g", calories: 290 },
  fish: { name: "Tofu Stir-fry", portion: "150g tofu + veggies", calories: 260 },
  roti: { name: "Multigrain Roti", portion: "2 medium", calories: 240 },
  eggs: { name: "Besan Chilla", portion: "2 medium", calories: 280 },
  banana: { name: "Apple + Nuts", portion: "1 apple + 10 almonds", calories: 210 },
  mutton: { name: "Rajma Bowl", portion: "1.25 cups", calories: 330 },
  naan: { name: "Phulka", portion: "2 medium", calories: 210 },
};

const parseKcal = (text) => {
  const m = String(text || "").match(/\((\d+)\s*kcal\)/i);
  return m ? Number(m[1]) : null;
};

const normalize = (value) => String(value || "").trim().toLowerCase();

const pickSwap = (item, dislikes) => {
  const itemLower = normalize(item);
  const match = dislikes.find((d) => itemLower.includes(d));
  if (!match) return null;
  return SWAP_LIBRARY[match] || { name: "Balanced Veg Bowl", portion: "1 bowl (350g)", calories: 300 };
};

// buildPreferencePlan function is no longer needed as we use the AI response directly

export default function NutritionPlanner({ onNavigate, onBack, onLogout }) {
  const { apiFetch, buildScopedKey, user } = useAuth();
  const [log, setLog] = useState({
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
    calorieGoal: 1800,
    waterLitres: 0,
    meals: { breakfast: [], lunch: [], snack: [], dinner: [] },
  });
  const [activeMeal, setActiveMeal] = useState("breakfast");
  const [activeCategory, setActiveCategory] = useState("protein");
  const [waterCups, setWaterCups] = useState(new Set()); // Legacy
  const [toast, setToast] = useState("");
  const [waterHistory, setWaterHistory] = useState([]);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pcodCycleDay, setPcodCycleDay] = useState(1);
  const [completedWorkoutMinutes, setCompletedWorkoutMinutes] = useState(0);
  const [phaseBannerOpen, setPhaseBannerOpen] = useState(true);

  const [favoriteDish, setFavoriteDish] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [personalPlan, setPersonalPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const favoriteDishKey = buildScopedKey("wf_favorite_dish");
  const dislikedFoodsKey = buildScopedKey("wf_disliked_foods");

  useEffect(() => {
    setFavoriteDish(localStorage.getItem(favoriteDishKey) || "");
    setDislikedFoods(localStorage.getItem(dislikedFoodsKey) || "");
    setPersonalPlan(null);
  }, [favoriteDishKey, dislikedFoodsKey, user?._id]);

  useEffect(() => {
    const loadToday = async () => {
      try {
        const data = await apiFetch("/api/nutrition/today");
        const nextLog = data.log || {
          totals: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
          calorieGoal: 1800,
          waterLitres: 0,
          meals: { breakfast: [], lunch: [], snack: [], dinner: [] },
        };
        setLog(nextLog);
        const cups = Math.max(0, Math.min(10, Math.round((nextLog.waterLitres || 0) / 0.25)));
        setWaterCups(new Set(Array.from({ length: cups }, (_, i) => i)));
      } catch (_err) {
        setLog({
          totals: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
          calorieGoal: 1800,
          waterLitres: 0,
          meals: { breakfast: [], lunch: [], snack: [], dinner: [] },
        });
        setWaterCups(new Set());
      }
    };

    const fetchPcodAndWorkouts = async () => {
      try {
        const pcodRes = await apiFetch("/api/pcod");
        if (pcodRes.cycleInfo?.cycleDay) setPcodCycleDay(pcodRes.cycleInfo.cycleDay);
      } catch (err) {}

      try {
        const workRes = await apiFetch("/api/workout/schedule?days=1");
        const todayStr = new Date().toISOString().split("T")[0];
        let minutes = 0;
        workRes.plans?.forEach(p => {
          if (p.status === "completed" && p.date.startsWith(todayStr)) {
            minutes += p.availableMinutes || 0;
          }
        });
        setCompletedWorkoutMinutes(minutes);
      } catch (err) {}
    };

    loadToday();
    fetchPcodAndWorkouts();
  }, [apiFetch, user?._id]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    localStorage.setItem(favoriteDishKey, favoriteDish);
  }, [favoriteDish, favoriteDishKey]);

  useEffect(() => {
    localStorage.setItem(dislikedFoodsKey, dislikedFoods);
  }, [dislikedFoods, dislikedFoodsKey]);

  const addFood = async (food) => {
    try {
      const payload = {
        mealType: activeMeal,
        food: { ...food, quantity: 1, category: activeCategory },
      };
      const data = await apiFetch("/api/nutrition/food", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setLog(data.log);
      showToast(`${food.name} added to ${activeMeal}`);
    } catch (err) {
      showToast(err.message);
    }
  };

  const removeFood = async (mealType, index) => {
    try {
      const data = await apiFetch("/api/nutrition/food", {
        method: "DELETE",
        body: JSON.stringify({ mealType, index }),
      });
      setLog(data.log);
    } catch (err) {
      showToast(err.message);
    }
  };

  const addWater = async (amountLiters) => {
    const nextLiters = Math.min(2.5, Number(((log.waterLitres || 0) + amountLiters).toFixed(2)));
    setWaterHistory(prev => [...prev, log.waterLitres || 0]);
    setLog({ ...log, waterLitres: nextLiters });
    try {
      await apiFetch("/api/nutrition/water", {
        method: "PUT",
        body: JSON.stringify({ waterLitres: nextLiters }),
      });
    } catch (_err) {}
  };

  const undoWater = async () => {
    if (waterHistory.length === 0) return;
    const previous = waterHistory[waterHistory.length - 1];
    setWaterHistory(prev => prev.slice(0, -1));
    setLog({ ...log, waterLitres: previous });
    try {
      await apiFetch("/api/nutrition/water", {
        method: "PUT",
        body: JSON.stringify({ waterLitres: previous }),
      });
    } catch (_err) {}
  };

  const generatePreferencePlan = async () => {
    if (!favoriteDish.trim() && !dislikedFoods.trim()) {
      showToast("Please add your food preferences first");
      return;
    }
    if (!favoriteDish.trim()) {
      showToast("Please enter your favorite dish");
      return;
    }
    
    setPlanLoading(true);
    try {
      const data = await apiFetch("/api/nutrition/meal-plan", {
        method: "POST",
        body: JSON.stringify({
          favoriteDish: favoriteDish,
          dislikedFoods: dislikedFoods.split(",").map((f) => f.trim()).filter(Boolean),
          calorieGoal: calorieGoal,
          cyclePhase: phaseInfo.name
        })
      });
      setPersonalPlan(data.plan);
      showToast("Personalized plan generated!");
    } catch (err) {
      showToast(err.message);
    } finally {
      setPlanLoading(false);
    }
  };

  const totals = log?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
  const calorieGoal = log?.calorieGoal || 1800;

  const categorySummary = useMemo(() => {
    const allFoods = [
      ...(log?.meals?.breakfast || []),
      ...(log?.meals?.lunch || []),
      ...(log?.meals?.snack || []),
      ...(log?.meals?.dinner || []),
    ];
    return CATEGORIES.map((c) => ({
      ...c,
      count: allFoods.filter((f) => f.category === c.key).length,
    })).filter((c) => c.count > 0);
  }, [log]);

  const getPhaseInfo = (day) => {
    if (day >= 1 && day <= 5) return { name: "Menstrual", colorClass: "menstrual", emoji: "🔴", recs: ["Sesame seeds", "Dates", "Drumstick leaves", "Jaggery"], avoids: ["High-sodium processed foods", "Excessive caffeine"], reason: "Iron helps replenish during period" };
    if (day >= 6 && day <= 13) return { name: "Follicular", colorClass: "follicular", emoji: "🌱", recs: ["Sprouts", "Eggs", "Pomegranate", "Green vegetables"], avoids: ["Refined sugars", "Alcohol"], reason: "Support rising estrogen with fresh, vibrant foods" };
    if (day === 14) return { name: "Ovulation", colorClass: "ovulation", emoji: "🌟", recs: ["Flaxseeds", "Turmeric milk", "Leafy greens"], avoids: ["Heavy greasy meals", "Dairy excess"], reason: "Manage potential peak estrogen inflammation" };
    return { name: "Luteal", colorClass: "luteal", emoji: "🌙", recs: ["Bananas", "Dark chocolate", "Pumpkin seeds", "Warm dal"], avoids: ["High sugar foods", "Excess salt"], reason: "Curb cravings and support progesterone production" };
  };
  const phaseInfo = getPhaseInfo(pcodCycleDay);

  const caloriesBurned = completedWorkoutMinutes * 7; // About 7 cal/min
  const netCalories = totals.calories - caloriesBurned;
  const remainingCals = calorieGoal - netCalories;

  const displayFoods = useMemo(() => {
    if (searchQuery) {
      const all = Object.values(FOOD_LIBRARY).flat();
      return all.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return FOOD_LIBRARY[activeCategory] || [];
  }, [searchQuery, activeCategory]);

  return (
    <div className={styles.layout}>
      <Sidebar active="nutrition" onNavigate={onNavigate} onLogout={onLogout} />

      <main className={styles.main}>
        <div className="page-header">
          <button className="back-btn" onClick={onBack}>Back to Dashboard</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div>
              <h1>Nutrition Planner</h1>
              <p>Add foods category-wise and track daily macros</p>
            </div>
            <button className={styles.weeklyBtn} onClick={() => setShowWeeklyReport(true)}>
              📊 This Week
            </button>
          </div>
        </div>

        <div className={`${styles.phaseBanner} ${styles[phaseInfo.colorClass]}`}>
          <div className={styles.phaseHeader} onClick={() => setPhaseBannerOpen(!phaseBannerOpen)}>
            <h3>{phaseInfo.emoji} {phaseInfo.name} Phase Guide</h3>
            <span className={`${styles.phaseChevron} ${phaseBannerOpen ? styles.open : ""}`}>▼</span>
          </div>
          {phaseBannerOpen && (
            <div className={styles.phaseContent}>
              <div className={styles.phaseReason}>{phaseInfo.reason}</div>
              <div>
                <h4>What to eat today</h4>
                <ul className={styles.phaseRecList}>
                  {phaseInfo.recs.map(r => <li key={r}>{r}</li>)}
                </ul>
              </div>
              <div>
                <h4>Limit / Avoid</h4>
                <ul className={styles.phaseAvoidList}>
                  {phaseInfo.avoids.map(a => <li key={a}>{a}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className={`grid-4 ${styles.macroStrip}`} style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {[
            { label: "Calories", value: `${totals.calories}`, target: `${calorieGoal}` },
            { label: "Protein", value: `${totals.protein}g`, target: "100g" },
            { label: "Carbs", value: `${totals.carbs}g`, target: "220g" },
            { label: "Fats", value: `${totals.fats}g`, target: "65g" },
            { label: "Fiber", value: `${totals.fiber}g`, target: "30g" },
          ].map((item) => (
            <div key={item.label} className="card" style={{ padding: "18px 16px" }}>
              <div style={{ fontSize: ".74rem", color: "var(--muted)", fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: "1.3rem", color: "var(--green)", fontWeight: 900 }}>
                {item.value}
                <span style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 500 }}> / {item.target}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.twoCol}>
          <div className="col">
            <div className={styles.energyBalance}>
              <div className={styles.energyTop}>
                <div className={styles.energyStat}>
                  <div className={styles.energyStatLabel}>🍽️ Eaten</div>
                  <div className={styles.energyStatVal}>{totals.calories} kcal</div>
                </div>
                <div className={`${styles.energyNet} ${styles[remainingCals > -100 ? (remainingCals < 100 ? "warning" : "deficit") : "over"]}`}>
                  {remainingCals >= 0 ? netCalories : `+${Math.abs(remainingCals)}`}
                </div>
                <div className={styles.energyStat}>
                  <div className={styles.energyStatLabel}>🔥 Burned</div>
                  <div className={styles.energyStatVal}>
                    {completedWorkoutMinutes === 0 ? "0" : caloriesBurned} kcal
                  </div>
                </div>
              </div>
              <div className={styles.energyBarWrapper}>
                <div className={styles.energyProgress} style={{ width: `${Math.min(100, (netCalories / calorieGoal) * 100)}%`, background: remainingCals < 0 ? "var(--blush)" : remainingCals < 100 ? "var(--gold)" : "var(--sage)" }} />
              </div>
              <div className={styles.energyFooter}>
                {remainingCals >= 0 ? `Net: ${remainingCals} kcal remaining` : `Net: ${Math.abs(remainingCals)} kcal over goal`}
                {completedWorkoutMinutes === 0 && (
                  <div style={{ marginTop: 6 }}><a className={styles.energyLink} onClick={() => onNavigate("workouts")}>Log a workout to see calories burned</a></div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Add Food by Category</div>

              <input
                type="text"
                placeholder="Search all foods..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {!searchQuery && (
                <>
                  <div className={styles.dayTabs}>
                    {MEALS.map((meal) => (
                      <button
                        key={meal.key}
                        className={`${styles.dTab} ${activeMeal === meal.key ? styles.dActive : ""}`}
                        onClick={() => setActiveMeal(meal.key)}
                      >
                        {meal.label}
                      </button>
                    ))}
                  </div>

                  <div className={styles.dayTabs}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        className={`${styles.dTab} ${activeCategory === cat.key ? styles.dActive : ""}`}
                        onClick={() => setActiveCategory(cat.key)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className={styles.mealSection}>
                {displayFoods.length === 0 && <div className={styles.prefHint}>No foods found.</div>}
                
                {/* Organize by subcategory if Indian + No Search */}
                {(!searchQuery && activeCategory === "indian") ? (
                  ["Breakfast", "Rice dishes", "Curries", "Sides", "Snacks", "Drinks"].map(subCat => {
                    const subFoods = displayFoods.filter(f => f.subCategory === subCat);
                    if (subFoods.length === 0) return null;
                    return (
                      <div key={subCat} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--sage)", marginBottom: 8, textTransform: "uppercase" }}>{subCat}</div>
                        {subFoods.map(food => (
                          <div key={food.name} className={styles.mealRow}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: ".86rem", fontWeight: 700 }}>{food.name}</div>
                              <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>
                                {food.calories} kcal | P {food.protein}g C {food.carbs}g F {food.fats}g
                              </div>
                            </div>
                            <button className="btn btn-sage" style={{ padding: "6px 10px", fontSize: ".75rem" }} onClick={() => addFood(food)}>Add</button>
                          </div>
                        ))}
                      </div>
                    );
                  })
                ) : (
                  displayFoods.map((food) => (
                    <div key={food.name} className={styles.mealRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: ".86rem", fontWeight: 700 }}>{food.name}</div>
                        <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>
                          {food.calories} kcal | P {food.protein}g C {food.carbs}g F {food.fats}g
                        </div>
                      </div>
                      <button className="btn btn-sage" style={{ padding: "6px 10px", fontSize: ".75rem" }} onClick={() => addFood(food)}>
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>

            <div className="card-title" style={{ marginTop: 8 }}>Today&apos;s Logged Meals</div>
            {MEALS.map((meal) => {
              const foods = log?.meals?.[meal.key] || [];
              return (
                <div key={meal.key} className={styles.mealSection}>
                  <div className={styles.mealSectionTitle}>{meal.label}</div>
                  {foods.length === 0 && <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>No foods added yet</div>}
                  {foods.map((food, idx) => (
                    <div key={`${food.name}-${idx}`} className={styles.mealRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: ".86rem", fontWeight: 600 }}>{food.name}</div>
                        <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                          {food.category || "other"} | {food.calories} kcal
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "5px 9px", fontSize: ".72rem" }}
                        onClick={() => removeFood(meal.key, idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="col">
            <div className="card">
              <div className="card-title">Food Preferences</div>
              <div className={styles.prefGrid}>
                <div>
                  <label className="form-label">Favorite Dish</label>
                  <input
                    className="form-input"
                    value={favoriteDish}
                    onChange={(e) => setFavoriteDish(e.target.value)}
                    placeholder="e.g., Paneer biryani"
                  />
                </div>
                <div>
                  <label className="form-label">Disliked Foods (comma separated)</label>
                  <input
                    className="form-input"
                    value={dislikedFoods}
                    onChange={(e) => setDislikedFoods(e.target.value)}
                    placeholder="e.g., oats, fish, eggs"
                  />
                </div>
              </div>
              <button className="btn btn-primary" type="button" onClick={generatePreferencePlan} disabled={planLoading}>
                {planLoading ? "Generating..." : "Generate Preference Diet Chart"}
              </button>

              {personalPlan ? (
                <div className={styles.prefPlan}>
                  {["breakfast", "lunch", "snack", "dinner"].map((mealKey) => (
                    personalPlan[mealKey] && Array.isArray(personalPlan[mealKey]) ? (
                      <div key={mealKey} className={styles.prefSection} style={{ marginBottom: "16px" }}>
                        <div className={styles.prefTitle} style={{ textTransform: "capitalize", fontSize: "1.1rem", marginBottom: "8px", fontWeight: "bold", color: "var(--sage-dark)" }}>
                          {mealKey}
                        </div>
                        {personalPlan[mealKey].map((item, idx) => (
                          <div key={idx} className={styles.prefRow} style={{ background: "var(--bg)", padding: "12px", borderRadius: "8px", marginBottom: "8px", border: "1px solid var(--border)" }}>
                            <div className={styles.prefDish} style={{ fontSize: "1.05rem", fontWeight: "700" }}>{item.food}</div>
                            <div className={styles.prefMeta} style={{ color: "var(--muted)", margin: "4px 0", fontSize: "0.85rem" }}>
                              {item.quantity} • {item.calories} kcal
                            </div>
                            <div className={styles.prefReasonTag} style={{ display: "inline-block", background: "rgba(111, 165, 111, 0.15)", color: "var(--sage)", padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600", marginTop: "4px" }}>
                              Why: {item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null
                  ))}
                  
                  <div className={styles.prefHighlightCard} style={{ background: "rgba(111, 165, 111, 0.1)", padding: "16px", borderRadius: "8px", marginTop: "16px", borderLeft: "4px solid var(--sage)" }}>
                    <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "4px" }}>Total: {personalPlan.totalCalories} kcal</div>
                    <div style={{ color: "var(--sage)", fontWeight: "500", marginTop: "4px" }}>💡 {personalPlan.highlight}</div>
                  </div>
                  
                  <button className="btn btn-ghost" style={{ marginTop: "16px", width: "100%", background: "var(--bg)", border: "1px solid var(--border)" }} onClick={generatePreferencePlan} disabled={planLoading}>
                    🔄 Regenerate Different Plan
                  </button>
                </div>
              ) : (
                <div className={styles.prefHint}>
                  Add your favorite and disliked foods, then generate a measured diet chart.
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">Hydration</div>
              <div className={styles.bottleContainer}>
                
                <svg viewBox="0 0 100 240" className={styles.bottleSvg}>
                  <defs>
                    <clipPath id="bottleClip">
                      <path d="M30 0 L70 0 C75 0 80 5 80 15 L80 40 C80 50 90 60 90 70 L90 220 C90 235 80 240 70 240 L30 240 C20 240 10 235 10 220 L10 70 C10 60 20 50 20 40 L20 15 C20 5 25 0 30 0 Z" />
                    </clipPath>
                  </defs>
                  {/* Background shape */}
                  <path d="M30 0 L70 0 C75 0 80 5 80 15 L80 40 C80 50 90 60 90 70 L90 220 C90 235 80 240 70 240 L30 240 C20 240 10 235 10 220 L10 70 C10 60 20 50 20 40 L20 15 C20 5 25 0 30 0 Z" 
                        fill="rgba(126, 200, 227, 0.05)" className={styles.bottleOutline} />
                  
                  {/* Fill shape bound by clipPath */}
                  <g clipPath="url(#bottleClip)">
                    <rect 
                      x="0" 
                      y={240 - ((log.waterLitres || 0) / 2.5 * 240)} 
                      width="100" 
                      height="240" 
                      className={`${styles.bottleFill} ${(log.waterLitres || 0) >= 2.5 ? styles.goalReached : ""}`} 
                    />
                  </g>
                  
                  {/* Glass reflections */}
                  <path d="M20 80 L20 210" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M80 80 L80 140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
                </svg>

                <div className={styles.waterDetails}>
                  <div className={styles.waterVol}>{(log.waterLitres || 0).toFixed(2)} L</div>
                  <div className={styles.waterPct}>{(Math.min(100, ((log.waterLitres || 0) / 2.5) * 100)).toFixed(0)}% of 2.5L</div>
                  {(log.waterLitres || 0) >= 2.5 && (
                    <div className={styles.waterGoalMsg}>🎉 Goal reached! Great job!</div>
                  )}
                </div>

                <div className={styles.waterBtns}>
                  <button className={styles.waterBtn} onClick={() => addWater(0.2)}>💧 200ml</button>
                  <button className={styles.waterBtn} onClick={() => addWater(0.3)}>🥤 300ml</button>
                  <button className={styles.waterBtn} onClick={() => addWater(0.5)}>🫗 500ml</button>
                  <button className={styles.waterBtn} onClick={() => addWater(1.0)}>🍶 1L</button>
                </div>

                {waterHistory.length > 0 && (
                  <div className={styles.undoWrap}>
                    <button className={styles.undoBtn} onClick={undoWater}>Undo last entry</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Category Summary</div>
              {categorySummary.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: ".8rem" }}>No foods logged today</div>
              )}
              {categorySummary.map((cat) => (
                <div key={cat.key} style={{ display: "flex", alignItems: "center", marginBottom: 9 }}>
                  <span style={{ flex: 1, fontSize: ".84rem" }}>{cat.label}</span>
                  <span
                    style={{
                      background: cat.color,
                      color: "#fff",
                      borderRadius: 999,
                      fontSize: ".72rem",
                      padding: "3px 9px",
                      fontWeight: 700,
                    }}
                  >
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {showWeeklyReport && <WeeklyNutritionReport onClose={() => setShowWeeklyReport(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
