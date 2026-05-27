const router = require('express').Router();
const ctrl = require('../controllers/copilotController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect, aiLimiter);
router.post('/chat', ctrl.chat);

module.exports = router;
