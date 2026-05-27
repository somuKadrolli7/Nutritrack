const User        = require('../models/User');
const Meal        = require('../models/Meal');
const Workout     = require('../models/Workout');
const HealthMetric= require('../models/HealthMetric');
const Achievement = require('../models/Achievement');
const cloudinary  = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const today = () => new Date().toISOString().split('T')[0];

/* ─── GET /api/user/profile ─────────────────────────────── */
exports.getProfile = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};

/* ─── PUT /api/user/profile ─────────────────────────────── */
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name','age','weight','height','gender','activityLevel','goal','calorieGoal','waterGoal','sleepGoal'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── PUT /api/user/avatar ──────────────────────────────── */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.body.imageBase64)
      return res.status(400).json({ error: 'No image provided.' });

    if (!process.env.CLOUDINARY_CLOUD_NAME)
      return res.status(503).json({ error: 'Cloudinary not configured.' });

    const result = await cloudinary.uploader.upload(req.body.imageBase64, {
      folder: 'nutritrack/avatars',
      transformation: [{ width: 256, height: 256, crop: 'fill' }],
    });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url }, { new: true });
    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/user/dashboard-stats ─────────────────────── */
exports.getDashboardStats = async (req, res) => {
  try {
    const d = today();
    const [todayMeals, todayWorkout, todayHealth, achievements] = await Promise.all([
      Meal.find({ userId: req.user._id, date: d }),
      Workout.find({ userId: req.user._id, date: d }),
      HealthMetric.findOne({ userId: req.user._id, date: d }),
      Achievement.find({ userId: req.user._id }).sort({ unlockedAt: -1 }).limit(5),
    ]);

    const caloriesConsumed = todayMeals.reduce((s, m) => s + m.totalCalories, 0);
    const caloriesBurned   = todayWorkout.reduce((s, w) => s + w.totalCaloriesBurned, 0);
    const protein = todayMeals.reduce((s, m) => s + m.totalProtein, 0);
    const carbs   = todayMeals.reduce((s, m) => s + m.totalCarbs, 0);
    const fat     = todayMeals.reduce((s, m) => s + m.totalFat, 0);

    res.json({
      caloriesConsumed,
      caloriesBurned,
      calorieGoal: req.user.calorieGoal || 2000,
      protein, carbs, fat,
      waterGlasses: todayHealth?.waterGlasses || 0,
      waterGoal:    req.user.waterGoal || 8,
      sleepHours:   todayHealth?.sleepHours || null,
      streak:       req.user.streak || 0,
      recentAchievements: achievements,
      meals:    todayMeals,
      workouts: todayWorkout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/user/achievements ────────────────────────── */
exports.getAchievements = async (req, res) => {
  try {
    const unlocked = await Achievement.find({ userId: req.user._id }).sort({ unlockedAt: -1 });
    const all = Object.entries(Achievement.schema.statics.BADGES || {}).map(([id, b]) => ({
      badgeId: id,
      ...b,
      unlocked: unlocked.some((u) => u.badgeId === id),
      unlockedAt: unlocked.find((u) => u.badgeId === id)?.unlockedAt || null,
    }));
    res.json({ achievements: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
