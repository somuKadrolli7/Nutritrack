const router = require('express').Router();
const ctrl   = require('../controllers/mealController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Food search & browse
router.get('/search',       ctrl.searchFoods);
router.get('/featured',     ctrl.getFeaturedFoods);
router.get('/weekly-stats', ctrl.getWeeklyStats);

// Favorites
router.get('/favorites',            ctrl.getFavorites);
router.post('/favorites/:foodId',   ctrl.toggleFavorite);

// Meal CRUD
router.get('/history',  ctrl.getMealHistory);
router.get('/summary',  ctrl.getDailySummary);
router.get('/',         ctrl.getMeals);
router.post('/',        ctrl.addMeal);
router.delete('/:id',   ctrl.deleteMeal);

module.exports = router;
