const router = require('express').Router();
const ctrl   = require('../controllers/aiController');
const { protect }   = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect, aiLimiter);
router.post('/chat',                ctrl.chat);
router.get('/meal-plan',            ctrl.mealPlan);
router.get('/local-diet-plan',      ctrl.localDietPlan);
router.get('/workout-plan',         ctrl.workoutPlan);
router.post('/meal-suggestions',    ctrl.mealSuggestions);
router.post('/workout-suggestions', ctrl.workoutSuggestions);
router.post('/scan-food',           ctrl.scanFood);
router.post('/disease-recommendation', ctrl.generateDiseaseRecommendation);

module.exports = router;
