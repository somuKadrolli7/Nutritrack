// server/controllers/healthController.js
const User = require('../models/User');
const HealthMetric = require('../models/HealthMetric');

// Compute BMR based on user profile
function computeBMR(user) {
  if (!user.weight || !user.height || !user.age) return 0;
  return Math.round(
    user.gender === 'male'
      ? 88.36 + 13.4 * user.weight + 4.8 * user.height - 5.7 * user.age
      : 447.6 + 9.2 * user.weight + 3.1 * user.height - 4.3 * user.age
  );
}

// Activity factor mapping for TDEE calculation
const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};
function computeTDEE(bmr, user) {
  const factor = activityFactors[user.activityLevel] || 1.2;
  return Math.round(bmr * factor);
}

// GET /api/health/summary – returns real‑time health data for the logged‑in user
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const bmi = user.bmi || null;
    const bmr = computeBMR(user);
    const tdee = computeTDEE(bmr, user);

    // Today health metric (water intake, etc.)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMetric = await HealthMetric.findOne({ userId, date: todayStr }) || {};

    // 7‑day water history for charts
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const metric = await HealthMetric.findOne({ userId, date: dStr }) || {};
      history.push({ date: dStr, waterGlasses: metric.waterGlasses || 0 });
    }

    // Simple static sleep data placeholder (replace with real data later)
    const sleepData = [
      { time: '10:00 PM', stage: 1 },
      { time: '11:00 PM', stage: 3 },
      { time: '12:00 AM', stage: 4 },
      { time: '01:00 AM', stage: 2 },
      { time: '02:00 AM', stage: 4 },
      { time: '03:00 AM', stage: 3 },
      { time: '04:00 AM', stage: 2 },
      { time: '05:00 AM', stage: 1 },
      { time: '06:00 AM', stage: 0 },
    ];

    const activityLevel = user.activityLevel || 'sedentary';
    
    res.json({
      bmi,
      bmr,
      tdee,
      activityLevel,
      waterGlasses: todayMetric.waterGlasses || 0,
      history,
      sleepData,
    });
  } catch (err) {
    console.error('[Health summary]', err);
    res.status(500).json({ error: 'Unable to fetch health data' });
  }
};

// POST /api/health/water – update today's water intake
exports.addWater = async (req, res) => {
  try {
    const userId = req.user._id;
    const { waterGlasses } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];
    await HealthMetric.findOneAndUpdate(
      { userId, date: todayStr },
      { $set: { waterGlasses } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Add water]', err);
    res.status(500).json({ error: 'Failed to update water intake' });
  }
};

// GET /api/health/history – 7‑day metric history (alias for summary.history)
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const metric = await HealthMetric.findOne({ userId, date: dStr }) || {};
      history.push({ date: dStr, waterGlasses: metric.waterGlasses || 0 });
    }
    res.json({ history });
  } catch (err) {
    console.error('[Health history]', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// Compatibility placeholders
exports.getMetrics = async (req, res) => {
  res.json({ message: 'Health metrics endpoint – use /summary for detailed data' });
};
exports.upsertMetrics = async (req, res) => {
  res.json({ message: 'Upsert metrics endpoint – not used in current UI' });
};
