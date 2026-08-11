export const calcBMI = (weight: number, height: number): string => {
  if (!weight || !height) return '';
  const hM = height / 100;
  return (weight / (hM * hM)).toFixed(1);
};

export const calcBMR = (weight: number, height: number, age: number, gender: string): number => {
  if (!weight || !height || !age) return 0;
  if (gender === 'female') {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
  return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
};

export const calcTDEE = (bmr: number, activityLevel: string): number => {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

export const bmiCategory = (bmiStr: string): { label: string; color: string } => {
  const bmi = parseFloat(bmiStr);
  if (!bmi) return { label: 'Unknown', color: 'gray' };
  if (bmi < 18.5) return { label: 'Underweight', color: 'blue' };
  if (bmi < 25) return { label: 'Normal', color: 'green' };
  if (bmi < 30) return { label: 'Overweight', color: 'yellow' };
  return { label: 'Obese', color: 'red' };
};

export const getCalorieGoal = (user: any): number => {
  if (user.calorieGoal) return user.calorieGoal;
  const bmr = calcBMR(user.weight || 70, user.height || 170, user.age || 25, user.gender || 'male');
  const tdee = calcTDEE(bmr, user.activityLevel || 'sedentary');
  
  if (user.goal === 'lose') return tdee - 500;
  if (user.goal === 'gain') return tdee + 500;
  return tdee;
};

export const todayStr = (): string => {
  return new Date().toISOString().split('T')[0];
};
