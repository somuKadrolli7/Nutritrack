const Meal        = require('../models/Meal');
const Food        = require('../models/Food');
const HealthMetric= require('../models/HealthMetric');
const Achievement = require('../models/Achievement');
const User        = require('../models/User');

const today = () => new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

/* ─── GET /api/meals?date=YYYY-MM-DD ────────────────────── */
exports.getMeals = async (req, res) => {
  try {
    const date = req.query.date || today();
    const meals = await Meal.find({ userId: req.user._id, date }).sort({ createdAt: 1 });
    res.json({ meals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/meals/history?days=7 ─────────────────────── */
exports.getMealHistory = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const from = new Date(); from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().split('T')[0];

    const meals = await Meal.find({
      userId: req.user._id,
      date:   { $gte: fromStr },
    }).sort({ date: -1 });

    res.json({ meals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── POST /api/meals ────────────────────────────────────── */
exports.addMeal = async (req, res) => {
  try {
    const { date, mealType, foods, notes } = req.body;
    if (!mealType || !foods?.length)
      return res.status(400).json({ error: 'mealType and at least one food item are required.' });

    const meal = await Meal.create({
      userId: req.user._id,
      date:   date || today(),
      mealType,
      foods,
      notes,
    });

    // Check achievement: first meal ever
    const count = await Meal.countDocuments({ userId: req.user._id });
    if (count === 1) {
      const badge = await Achievement.unlock(req.user._id, 'first_meal');
      if (badge && req.io) req.io.to(`user_${req.user._id}`).emit('achievement', badge);
    }

    if (req.io) req.io.to(`user_${req.user._id}`).emit('meal_added', meal);

    res.status(201).json({ meal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── DELETE /api/meals/:id ──────────────────────────────── */
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meal) return res.status(404).json({ error: 'Meal not found.' });
    if (req.io) req.io.to(`user_${req.user._id}`).emit('meal_deleted', req.params.id);
    res.json({ message: 'Meal deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/meals/summary?date=YYYY-MM-DD ────────────── */
exports.getDailySummary = async (req, res) => {
  try {
    const date  = req.query.date || today();
    const meals = await Meal.find({ userId: req.user._id, date });
    const summary = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.totalCalories,
        protein:  acc.protein  + m.totalProtein,
        carbs:    acc.carbs    + m.totalCarbs,
        fat:      acc.fat      + m.totalFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    res.json({ date, summary, meals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/meals/search?q=&category=&tags= ──────────── */
exports.searchFoods = async (req, res) => {
  try {
    const { q = '', category, tags } = req.query;
    const filter = {};

    // Text search across name, nameAlt, cuisineType, and tags
    if (q.trim()) {
      const re = new RegExp(q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { nameAlt: re }, { tags: re }, { cuisineType: re }];
    }

    // Special 'indian' tag — maps to multiple categories
    if (tags) {
      const tagArr = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (tagArr.includes('indian')) {
        filter.category = { $in: ['south_indian', 'north_indian', 'indian_common'] };
      } else {
        filter.tags = { $all: tagArr };
      }
    }

    // Explicit category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    const foods = await Food.find(filter).limit(60).sort({ name: 1 });
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/meals/featured — returns all foods if no search ── */
exports.getFeaturedFoods = async (req, res) => {
  try {
    const foods = await Food.find({}).limit(60).sort({ name: 1 });
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── POST /api/meals/favorites/:foodId ─────────────────── */
exports.toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const foodId = req.params.foodId;
    const isFav = user.favorites?.includes(foodId);

    if (isFav) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: foodId } });
      res.json({ favorited: false });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: foodId } });
      res.json({ favorited: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/meals/favorites ──────────────────────────── */
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json({ favorites: user.favorites || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/meals/weekly-stats ───────────────────────── */
exports.getWeeklyStats = async (req, res) => {
  try {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayMeals = await Meal.find({ userId: req.user._id, date: dStr });
      const calories = dayMeals.reduce((s, m) => s + m.totalCalories, 0);
      const protein  = dayMeals.reduce((s, m) => s + m.totalProtein,  0);
      const carbs    = dayMeals.reduce((s, m) => s + m.totalCarbs,    0);
      const fat      = dayMeals.reduce((s, m) => s + m.totalFat,      0);
      stats.push({
        date: dStr,
        day: new Date(dStr).toLocaleDateString('en-US', { weekday: 'short' }),
        calories, protein, carbs, fat,
      });
    }
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
