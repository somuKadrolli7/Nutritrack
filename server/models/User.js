const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, minlength: 6, select: false },
    googleId: { type: String, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin', 'nutritionist'], default: 'user' },

    // Body metrics
    age:    { type: Number, min: 1, max: 120 },
    weight: { type: Number, min: 1, max: 500 },   // kg
    height: { type: Number, min: 30, max: 300 },   // cm
    gender: { type: String, enum: ['male', 'female', 'other'] },

    // App settings
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'veryActive'],
      default: 'sedentary',
    },
    goal: { type: String, enum: ['lose', 'maintain', 'gain'], default: 'maintain' },
    calorieGoal:   { type: Number, default: 2000 },
    waterGoal:     { type: Number, default: 8 },   // glasses
    sleepGoal:     { type: Number, default: 8 },   // hours

    // Streak tracking
    streak:       { type: Number, default: 0 },
    lastActiveAt: { type: Date },

    // OTP / password reset
    otp:          { type: String, select: false },
    otpExpiresAt: { type: Date,   select: false },
    isVerified:   { type: Boolean, default: true },

    // Refresh token
    refreshToken: { type: String, select: false },

    // Favourite foods (ObjectId refs to Food collection)
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
  },
  { timestamps: true }
);

/* ─── Hash password before save ─────────────────────────── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ─── Instance methods ───────────────────────────────────── */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.googleId;
  return obj;
};

/* ─── Virtual: BMI ───────────────────────────────────────── */
userSchema.virtual('bmi').get(function () {
  if (!this.weight || !this.height) return null;
  return +( this.weight / (this.height / 100) ** 2 ).toFixed(1);
});

module.exports = mongoose.model('User', userSchema);
