const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController.js');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', cityController.getAllCities);
router.get('/:id', cityController.getCityById);
// router.post('/', protect, adminOnly, cityController.createCity);
// router.put('/:id', protect, adminOnly, cityController.updateCity);
// router.delete('/:id', protect, adminOnly, cityController.deleteCity);
router.post('/', cityController.createCity);
router.put('/:id', cityController.updateCity);
router.delete('/:id', cityController.deleteCity);

module.exports = router;
