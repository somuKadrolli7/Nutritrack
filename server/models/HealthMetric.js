const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date:   { type: String, required: true, index: true }, // 'YYYY-MM-DD'

    // Weight & body
    weight: { type: Number },  // kg
    bmi:    { type: Number },

    // Water intake
    waterGlasses: { type: Number, default: 0 },  // glasses (250ml each)

    // Sleep
    sleepHours:   { type: Number },               // hours
    sleepQuality: { type: Number, min: 1, max: 5 }, // 1–5 stars

    // Activity
    steps: { type: Number, default: 0 },

    // Mood (1=sad, 5=great)
    mood: { type: Number, min: 1, max: 5 },

    // Blood pressure (optional)
    systolic:  { type: Number },
    diastolic: { type: Number },
  },
  { timestamps: true }
);

// One document per user per day
healthMetricSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
