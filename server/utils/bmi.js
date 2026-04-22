const normalizeHeightToMeters = (height) => {
  const numericHeight = Number(height);
  if (!Number.isFinite(numericHeight) || numericHeight <= 0) {
    throw new Error("Please provide valid weight and height values.");
  }

  return numericHeight > 3 ? numericHeight / 100 : numericHeight;
};

const getBmiCategory = (bmi) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

const calculateBmi = ({ weightKg, height }) => {
  const numericWeight = Number(weightKg);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    throw new Error("Please provide valid weight and height values.");
  }

  const heightMeters = normalizeHeightToMeters(height);
  const bmi = Number((numericWeight / (heightMeters * heightMeters)).toFixed(2));

  return {
    bmi,
    category: getBmiCategory(bmi),
    heightMeters,
  };
};

module.exports = { calculateBmi, getBmiCategory, normalizeHeightToMeters };
