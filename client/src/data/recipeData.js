export const recipeData = [
  // MENSTRUAL phase
  {
    id: "m1",
    title: "Sesame Jaggery Balls",
    titleTamil: "எள்ளு உருண்டை",
    phase: "Menstrual",
    prepTime: "10 min",
    calories: 120,
    protein: 3,
    carbs: 15,
    fat: 6,
    ingredients: ["Sesame seeds", "Jaggery", "Ghee", "Cardamom"],
    steps: [
      "Dry roast sesame seeds until they pop.",
      "Melt jaggery with a little water to form a syrup.",
      "Mix roasted sesame seeds, cardamom powder, and ghee into the syrup.",
      "Roll into small balls while still warm."
    ],
    tags: ["Iron", "cramp relief"],
    image: "🧆",
    goodFor: "Iron + cramp relief"
  },
  {
    id: "m2",
    title: "Spinach Dal",
    titleTamil: "கீரை பருப்பு",
    phase: "Menstrual",
    prepTime: "20 min",
    calories: 180,
    protein: 10,
    carbs: 22,
    fat: 4,
    ingredients: ["Toor dal", "Spinach", "Tomato", "Turmeric", "Cumin"],
    steps: [
      "Wash and boil toor dal until soft.",
      "Chop spinach and tomatoes.",
      "Temper cumin in ghee, add tomatoes, turmeric, and spinach.",
      "Mix with cooked dal and simmer for 5 minutes."
    ],
    tags: ["Iron replenishment"],
    image: "🍲",
    goodFor: "Iron replenishment"
  },
  {
    id: "m3",
    title: "Ginger Turmeric Tea",
    titleTamil: "இஞ்சி மஞ்சள் தேநீர்",
    phase: "Menstrual",
    prepTime: "5 min",
    calories: 20,
    protein: 0,
    carbs: 4,
    fat: 0,
    ingredients: ["Ginger", "Turmeric", "Honey", "Black pepper", "Water"],
    steps: [
      "Boil water in a pan.",
      "Add grated ginger, turmeric, and a pinch of black pepper.",
      "Let it simmer for 3-5 minutes.",
      "Strain and stir in honey before serving."
    ],
    tags: ["Anti-inflammatory", "cramp relief"],
    image: "🫖",
    goodFor: "Anti-inflammatory, cramp relief"
  },

  // FOLLICULAR phase
  {
    id: "f1",
    title: "Sprouts Salad",
    titleTamil: "முளைகட்டிய சாலட்",
    phase: "Follicular",
    prepTime: "10 min",
    calories: 150,
    protein: 9,
    carbs: 18,
    fat: 3,
    ingredients: ["Mixed sprouts", "Cucumber", "Tomato", "Lemon", "Chat masala"],
    steps: [
      "Steam the mixed sprouts lightly.",
      "Chop cucumber, tomato, and onions finely.",
      "Toss the vegetables with the sprouts.",
      "Squeeze lemon and sprinkle with chat masala before eating."
    ],
    tags: ["Estrogen support", "protein"],
    image: "🥗",
    goodFor: "Estrogen support + protein"
  },
  {
    id: "f2",
    title: "Ragi Dosa",
    titleTamil: "ராகி தோசை",
    phase: "Follicular",
    prepTime: "20 min",
    calories: 160,
    protein: 5,
    carbs: 28,
    fat: 3,
    ingredients: ["Ragi flour", "Rice flour", "Onion", "Curry leaves", "Oil"],
    steps: [
      "Mix ragi flour, a little rice flour, and salt with water to form a batter.",
      "Add finely chopped onions and curry leaves.",
      "Pour onto a hot pan like a thin crepe.",
      "Cook with a drizzle of oil until crisp."
    ],
    tags: ["Calcium", "iron", "low GI"],
    image: "🥞", // Using pancake as dosa alternative
    goodFor: "Calcium + iron + low GI"
  },
  {
    id: "f3",
    title: "Egg Bhurji",
    titleTamil: "முட்டை பொரியல்",
    phase: "Follicular",
    prepTime: "10 min",
    calories: 200,
    protein: 14,
    carbs: 5,
    fat: 14,
    ingredients: ["Eggs", "Onion", "Tomato", "Green chilli", "Turmeric", "Oil"],
    steps: [
      "Whisk the eggs in a bowl.",
      "Heat oil, sauté chopped green chillies, onions, and tomatoes.",
      "Add turmeric powder and salt.",
      "Pour the eggs and scramble until fully cooked."
    ],
    tags: ["Protein boost"],
    image: "🍳",
    goodFor: "Protein boost"
  },

  // OVULATORY phase
  {
    id: "o1",
    title: "Flaxseed Chutney",
    titleTamil: "ஆளி விதை சட்னி",
    phase: "Ovulatory",
    prepTime: "5 min",
    calories: 90,
    protein: 4,
    carbs: 5,
    fat: 7,
    ingredients: ["Flaxseeds", "Coconut", "Green chilli", "Ginger", "Salt"],
    steps: [
      "Dry roast flaxseeds lightly.",
      "Blend roasted flaxseeds, grated coconut, green chilli, and ginger.",
      "Add water and salt to taste to reach desired consistency."
    ],
    tags: ["Omega-3", "hormone balance"],
    image: "🥥",
    goodFor: "Omega-3 + hormone balance"
  },
  {
    id: "o2",
    title: "Chickpea Sundal",
    titleTamil: "கொண்டைக்கடலை சுண்டல்",
    phase: "Ovulatory",
    prepTime: "15 min",
    calories: 190,
    protein: 10,
    carbs: 28,
    fat: 4,
    ingredients: ["Chickpeas", "Mustard", "Curry leaves", "Coconut", "Lemon"],
    steps: [
      "Soak and pressure cook chickpeas until soft.",
      "Temper mustard seeds and curry leaves in oil.",
      "Add the cooked chickpeas and sauté briefly.",
      "Garnish with grated coconut and lemon juice."
    ],
    tags: ["Plant protein", "fiber"],
    image: "🧆",
    goodFor: "Plant protein + fiber"
  },
  {
    id: "o3",
    title: "Turmeric Milk",
    titleTamil: "மஞ்சள் பால்",
    phase: "Ovulatory",
    prepTime: "5 min",
    calories: 120,
    protein: 4,
    carbs: 12,
    fat: 6,
    ingredients: ["Milk", "Turmeric", "Black pepper", "Honey", "Cardamom"],
    steps: [
      "Bring milk to a simmer in a saucepan.",
      "Add turmeric, a pinch of black pepper, and cardamom powder.",
      "Simmer for 2 minutes and turn off the heat.",
      "Stir in honey and serve warm."
    ],
    tags: ["Anti-inflammatory", "sleep"],
    image: "🥛",
    goodFor: "Anti-inflammatory + sleep"
  },

  // LUTEAL phase
  {
    id: "l1",
    title: "Banana Oats Smoothie",
    titleTamil: "வாழைப்பழம் ஓட்ஸ்",
    phase: "Luteal",
    prepTime: "5 min",
    calories: 220,
    protein: 6,
    carbs: 42,
    fat: 4,
    ingredients: ["Banana", "Oats", "Milk", "Honey", "Cinnamon"],
    steps: [
      "Peel the banana and roughly chop it.",
      "Add oats, banana, milk, and a pinch of cinnamon into a blender.",
      "Blend until smooth.",
      "Stir in honey and serve immediately."
    ],
    tags: ["Serotonin", "magnesium"],
    image: "🥤",
    goodFor: "Serotonin + magnesium"
  },
  {
    id: "l2",
    title: "Pumpkin Seed Ladoo",
    titleTamil: "பரங்கி விதை லட்டு",
    phase: "Luteal",
    prepTime: "15 min",
    calories: 140,
    protein: 5,
    carbs: 12,
    fat: 9,
    ingredients: ["Pumpkin seeds", "Dates", "Coconut", "Cardamom"],
    steps: [
      "Dry roast pumpkin seeds separately.",
      "Blend pitted dates into a paste.",
      "Mix crushed pumpkin seeds, dates, desiccated coconut, and cardamom.",
      "Roll into bite-sized ladoos."
    ],
    tags: ["Magnesium", "zinc for PMS"],
    image: "🧆",
    goodFor: "Magnesium + zinc for PMS"
  },
  {
    id: "l3",
    title: "Moong Dal Khichdi",
    titleTamil: "பாசிப்பருப்பு கிச்சடி",
    phase: "Luteal",
    prepTime: "25 min",
    calories: 240,
    protein: 12,
    carbs: 38,
    fat: 5,
    ingredients: ["Moong dal", "Rice", "Ghee", "Cumin", "Turmeric", "Ginger"],
    steps: [
      "Wash and soak rice and moong dal for 15 minutes.",
      "Heat ghee in a pressure cooker and add cumin seeds.",
      "Add grated ginger, turmeric, and the soaked rice/dal mix.",
      "Cook with water until soft and mushy."
    ],
    tags: ["Easy digestion", "comfort food"],
    image: "🍲",
    goodFor: "Easy digestion + comfort food"
  }
];
