const rateLimit = require('express-rate-limit');

/* Strict limiter for auth routes — 10 attempts per 15 min */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* Moderate limiter for AI endpoints — 30 per 15 min */
exports.aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'AI rate limit reached. Please wait before sending more messages.' },
});
