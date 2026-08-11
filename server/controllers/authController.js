const User        = require('../models/User');
const Achievement = require('../models/Achievement');
const { signAccessToken, signRefreshToken, verifyRefreshToken, generateOTP } = require('../utils/jwt');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');

const OTP_TTL = 10 * 60 * 1000; // 10 minutes

/* ─── helpers ────────────────────────────────────────────── */
const setTokens = (user) => ({
  accessToken:  signAccessToken({ id: user._id, role: user.role }),
  refreshToken: signRefreshToken({ id: user._id }),
});

/* ─── POST /api/auth/register ───────────────────────────── */
exports.register = async (req, res) => {
  try {
    const { name, email, password, age, weight, height, gender, goal, activityLevel, dietPreference } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Email already in use.' });

    // Map frontend goal to backend enum
    let backendGoal = 'maintain';
    if (goal === 'lose_weight') backendGoal = 'lose';
    else if (goal === 'gain_muscle') backendGoal = 'gain';

    // Map frontend activity level to backend enum
    let backendActivity = 'sedentary';
    if (activityLevel === 'very_active') backendActivity = 'veryActive';
    else if (['sedentary', 'light', 'moderate', 'active'].includes(activityLevel)) backendActivity = activityLevel;

    const user = await User.create({
      name, email, password,
      age: age || undefined,
      weight: weight || undefined,
      height: height || undefined,
      gender: gender || undefined,
      goal: backendGoal,
      activityLevel: backendActivity,
      dietPreference: dietPreference || 'any',
      isVerified: true,
    });

    const tokens = setTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(201).json({
      message: 'Registration successful!',
      ...tokens,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('[register]', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: err.message || 'Registration failed. Please try again.' });
  }
};

/* ─── POST /api/auth/verify-otp ─────────────────────────── */
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+otp +otpExpiresAt');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isVerified) return res.json({ message: 'Already verified.' });
    if (user.otp !== otp || user.otpExpiresAt < Date.now())
      return res.status(400).json({ error: 'Invalid or expired OTP.' });

    user.isVerified   = true;
    user.otp          = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const tokens = setTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ message: 'Email verified!', ...tokens, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── POST /api/auth/login ───────────────────────────────── */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password.' });

    const tokens = setTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ message: 'Login successful!', ...tokens, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── POST /api/auth/refresh ─────────────────────────────── */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

    const decoded = verifyRefreshToken(refreshToken);
    const user    = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ error: 'Invalid refresh token.' });

    const tokens = setTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token expired or invalid.' });
  }
};

/* ─── POST /api/auth/logout ──────────────────────────────── */
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) { user.refreshToken = undefined; await user.save(); }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── POST /api/auth/forgot-password ────────────────────── */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond OK to avoid email enumeration
    if (!user) return res.json({ message: 'If that email exists, an OTP has been sent.' });

    const otp = generateOTP();
    user.otp          = otp;
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL);
    await user.save();

    await sendPasswordResetEmail(email, otp);
    res.json({ message: 'OTP sent to your email.', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── POST /api/auth/reset-password ─────────────────────── */
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const user = await User.findById(userId).select('+otp +otpExpiresAt +password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.otp !== otp || user.otpExpiresAt < Date.now())
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    user.password     = newPassword;
    user.otp          = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ─── GET /api/auth/me ───────────────────────────────────── */
exports.getMe = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};

/* ─── Google OAuth Flow ──────────────────────────────────── */
/* Passport will call this after verifying the Google token */
exports.googleAuth = async (profile) => {
  try {
    // Check if user exists by Google ID or email
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // Try to find by email
      user = await User.findOne({ email: profile.emails?.[0]?.value });
      
      if (user) {
        // Update existing user with Google ID
        user.googleId = profile.id;
      } else {
        // Create new user from Google profile
        user = await User.create({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || 'User',
          isVerified: true, // Google users are already verified
          avatar: profile.photos?.[0]?.value || '',
        });
      }
    }
    
    await user.save();
    return user;
  } catch (err) {
    console.error('[googleAuth] Error:', err);
    throw err;
  }
};

/* ─── POST /api/auth/google/callback ─────────────────────── */
exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    const tokens = setTokens(req.user);
    req.user.refreshToken = tokens.refreshToken;
    await req.user.save();

    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: req.user._id,
    });

    res.redirect(`${process.env.CLIENT_URL}/auth-callback?${params.toString()}`);
  } catch (err) {
    console.error('[googleCallback] Error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=callback_failed`);
  }
};
