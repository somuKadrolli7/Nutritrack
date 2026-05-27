const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  nameAlt:     [String], // alternative search terms / aliases
  category:    {
    type: String,
    enum: ['fruit','vegetable','grain','dairy','protein','snack','beverage','south_indian','north_indian','indian_common','international','gym'],
    required: true,
  },
  cuisineType: { type: String, default: 'common' }, // 'south_indian', 'north_indian', 'international', etc.

  // Per serving values
  servingSize:   { type: Number, default: 100 }, // grams
  servingUnit:   { type: String, default: 'g' },
  servingLabel:  { type: String, default: '1 serving (100g)' },

  // Macros (per serving)
  calories: { type: Number, required: true },
  protein:  { type: Number, default: 0 },
  carbs:    { type: Number, default: 0 },
  fat:      { type: Number, default: 0 },
  fiber:    { type: Number, default: 0 },
  sugar:    { type: Number, default: 0 },
  sodium:   { type: Number, default: 0 },   // mg

  // Dietary tags
  tags: [String], // e.g. ['vegan','high-protein','low-carb','vegetarian']

  // Meal suitability
  mealTypes: [{ type: String, enum: ['breakfast','lunch','dinner','snack'] }],

  // Display
  emoji:    { type: String, default: '🍽️' },
  imageUrl: { type: String, default: '' },

  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

foodSchema.index({ name: 'text', nameAlt: 'text', tags: 'text' });
foodSchema.index({ category: 1 });

module.exports = mongoose.model('Food', foodSchema);
