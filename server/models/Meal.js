const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit:     { type: String, default: 'serving' },
  calories: { type: Number, required: true },
  protein:  { type: Number, default: 0 },
  carbs:    { type: Number, default: 0 },
  fat:      { type: Number, default: 0 },
  fiber:    { type: Number, default: 0 },
}, { _id: false });

const mealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date:   { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    foods: [foodItemSchema],
    totalCalories: { type: Number, default: 0 },
    totalProtein:  { type: Number, default: 0 },
    totalCarbs:    { type: Number, default: 0 },
    totalFat:      { type: Number, default: 0 },
    notes: { type: String, maxlength: 500 },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

/* ─── Auto-calculate totals before save ─────────────────── */
mealSchema.pre('save', function (next) {
  this.totalCalories = this.foods.reduce((s, f) => s + (f.calories || 0), 0);
  this.totalProtein  = this.foods.reduce((s, f) => s + (f.protein  || 0), 0);
  this.totalCarbs    = this.foods.reduce((s, f) => s + (f.carbs    || 0), 0);
  this.totalFat      = this.foods.reduce((s, f) => s + (f.fat      || 0), 0);
  next();
});

module.exports = mongoose.model('Meal', mealSchema);
