const express = require('express');
const router = express.Router();
const theaterController = require('../controllers/theaterController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', theaterController.getAllTheaters);
router.get('/:id', theaterController.getTheaterById);
// router.post('/', protect, adminOnly, theaterController.createTheater);
// router.put('/:id', protect, adminOnly, theaterController.updateTheater);
// router.delete('/:id', protect, adminOnly, theaterController.deleteTheater);
router.post('/', theaterController.createTheater);
router.put('/:id', theaterController.updateTheater);
router.delete('/:id', theaterController.deleteTheater);

module.exports = router;
