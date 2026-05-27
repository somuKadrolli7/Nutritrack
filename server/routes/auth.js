const router  = require('express').Router();
const ctrl    = require('../controllers/authController');
const { protect }      = require('../middleware/auth');
const { authLimiter }  = require('../middleware/rateLimiter');
const passport = require('passport');

router.post('/register',        authLimiter, ctrl.register);
router.post('/verify-otp',      authLimiter, ctrl.verifyOTP);
router.post('/login',           authLimiter, ctrl.login);
router.post('/refresh',                      ctrl.refresh);
router.post('/logout',          protect,     ctrl.logout);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, ctrl.resetPassword);
router.get('/me',               protect,     ctrl.getMe);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  ctrl.googleCallback
);

module.exports = router;
