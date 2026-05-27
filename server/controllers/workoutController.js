const Workout     = require('../models/Workout');
const Achievement = require('../models/Achievement');

const today = () => new Date().toISOString().split('T')[0];

/* ─── GET /api/workouts?date=YYYY-MM-DD ─────────────────── */
exports.getWorkouts = async (req, res) => {
  try {
    const date = req.query.date || today();
    const workouts = await Workout.find({ userId: req.user._id, date });
    res.json({ workouts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/workouts/history?days=7 ──────────────────── */
exports.getWorkoutHistory = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const from = new Date(); from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().split('T')[0];
    const workouts = await Workout.find({ userId: req.user._id, date: { $gte: fromStr } }).sort({ date: -1 });
    res.json({ workouts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── POST /api/workouts ─────────────────────────────────── */
exports.addWorkout = async (req, res) => {
  try {
    const { date, name, exercises, intensity, notes } = req.body;
    if (!exercises?.length)
      return res.status(400).json({ error: 'At least one exercise is required.' });

    const workout = await Workout.create({
      userId: req.user._id,
      date: date || today(),
      name, exercises, intensity, notes,
    });

    // Achievement: first workout
    const count = await Workout.countDocuments({ userId: req.user._id });
    if (count === 1) {
      const badge = await Achievement.unlock(req.user._id, 'first_workout');
      if (badge && req.io) req.io.to(`user_${req.user._id}`).emit('achievement', badge);
    }

    if (req.io) req.io.to(`user_${req.user._id}`).emit('workout_added', workout);

    res.status(201).json({ workout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── DELETE /api/workouts/:id ───────────────────────────── */
exports.deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!workout) return res.status(404).json({ error: 'Workout not found.' });
    res.json({ message: 'Workout deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/workouts/stats ────────────────────────────── */
exports.getStats = async (req, res) => {
  try {
    const days = 30;
    const from = new Date(); from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().split('T')[0];

    const workouts = await Workout.find({ userId: req.user._id, date: { $gte: fromStr } });
    const totalCalories = workouts.reduce((s, w) => s + w.totalCaloriesBurned, 0);
    const totalMinutes  = workouts.reduce((s, w) => s + w.totalDuration, 0);

    res.json({ totalWorkouts: workouts.length, totalCaloriesBurned: totalCalories, totalMinutes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
