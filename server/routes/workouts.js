const router = require('express').Router();
const ctrl   = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/history', ctrl.getWorkoutHistory);
router.get('/stats',   ctrl.getStats);
router.get('/',        ctrl.getWorkouts);
router.post('/',       ctrl.addWorkout);
router.delete('/:id',  ctrl.deleteWorkout);

module.exports = router;
