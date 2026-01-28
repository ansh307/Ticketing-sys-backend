const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', showController.getAllShows);
router.get('/:id', showController.getShowById);
// router.post('/', protect, adminOnly, showController.createShow);
// router.put('/:id', protect, adminOnly, showController.updateShow);
// router.delete('/:id', protect, adminOnly, showController.deleteShow);
router.post('/', showController.createShow);
router.put('/:id', showController.updateShow);
router.delete('/:id', showController.deleteShow);

module.exports = router;
