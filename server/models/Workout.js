const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'cardio' }, // cardio | strength | flexibility
  duration: { type: Number, default: 0 },  // minutes
  sets: { type: Number },
  reps: { type: Number },
  weight: { type: Number },               // kg
  caloriesBurned: { type: Number, default: 0 },
  notes: { type: String },
}, { _id: false });

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    name: { type: String, default: 'My Workout' },
    exercises: [exerciseSchema],
    totalDuration: { type: Number, default: 0 }, // minutes
    totalCaloriesBurned: { type: Number, default: 0 },
    intensity: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

/* ─── Auto-calculate totals ─────────────────────────────── */
workoutSchema.pre('save', function (next) {
  this.totalDuration = this.exercises.reduce((s, e) => s + (e.duration || 0), 0);
  this.totalCaloriesBurned = this.exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  next();
});

module.exports = mongoose.model('Workout', workoutSchema);
