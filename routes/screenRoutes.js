const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController.js');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', screenController.getAllScreens);
router.get('/:id', screenController.getScreenById);
router.post('/', protect, adminOnly, screenController.createScreen);
router.put('/:id', protect, adminOnly, screenController.updateScreen);
router.delete('/:id', protect, adminOnly, screenController.deleteScreen);

module.exports = router;
