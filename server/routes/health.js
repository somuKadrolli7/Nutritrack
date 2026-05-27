const router = require('express').Router();
const ctrl   = require('../controllers/healthController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/history', ctrl.getHistory);
router.post('/water',  ctrl.addWater);
router.get('/',        ctrl.getSummary); // now returns real‑time health summary
router.post('/',       ctrl.upsertMetrics);

module.exports = router;
