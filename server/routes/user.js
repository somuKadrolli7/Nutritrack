const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/profile',         ctrl.getProfile);
router.put('/profile',         ctrl.updateProfile);
router.put('/avatar',          ctrl.uploadAvatar);
router.get('/dashboard-stats', ctrl.getDashboardStats);
router.get('/achievements',    ctrl.getAchievements);

module.exports = router;
