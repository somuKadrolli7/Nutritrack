const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/* ─── Protect route — require valid JWT ─────────────────── */
exports.protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });

    const token = auth.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Attach user to request (no password/sensitive fields)
    const user = await User.findById(decoded.id).select('-password -refreshToken -otp');
    if (!user) return res.status(401).json({ error: 'User not found.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired. Please refresh.' });
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/* ─── Restrict to specific roles ─────────────────────────── */
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'You do not have permission for this action.' });
  next();
};
