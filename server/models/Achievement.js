const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badgeId:     { type: String, required: true },   // e.g. 'first_meal', 'streak_7'
    title:       { type: String, required: true },
    description: { type: String },
    icon:        { type: String },                   // emoji or URL
    unlockedAt:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

/* ─── Badge definitions (static) ───────────────────────── */
const BADGES = {
  first_meal:        { title: 'First Meal Logged!',     icon: '🍽️', description: 'You logged your first meal.' },
  first_workout:     { title: 'First Workout Done!',    icon: '💪', description: 'You logged your first workout.' },
  streak_3:          { title: '3-Day Streak!',          icon: '🔥', description: 'You were active 3 days in a row.' },
  streak_7:          { title: '7-Day Streak!',          icon: '⚡', description: 'One full week of consistency!' },
  streak_30:         { title: '30-Day Streak!',         icon: '🏆', description: 'Incredible — 30 days straight!' },
  hydration_hero:    { title: 'Hydration Hero',         icon: '💧', description: 'Hit your water goal for the day.' },
  calorie_goal:      { title: 'Calorie Goal Met',       icon: '🎯', description: 'You hit your calorie target today.' },
  sleep_champ:       { title: 'Sleep Champion',         icon: '😴', description: 'You logged 8+ hours of sleep.' },
  weight_loss_5:     { title: '5kg Down!',              icon: '📉', description: 'You lost 5kg — amazing progress!' },
  ai_conversation:   { title: 'AI Explorer',            icon: '🤖', description: 'You had your first AI chat session.' },
};

achievementSchema.statics.BADGES = BADGES;

achievementSchema.statics.unlock = async function (userId, badgeId) {
  const badge = BADGES[badgeId];
  if (!badge) return null;
  try {
    const doc = await this.create({ userId, badgeId, ...badge });
    return doc;
  } catch (err) {
    if (err.code === 11000) return null; // already unlocked
    throw err;
  }
};

module.exports = mongoose.model('Achievement', achievementSchema);
