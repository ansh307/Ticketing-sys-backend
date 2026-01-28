const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);
// router.post('/', protect, adminOnly, movieController.createMovie);
// router.put('/:id', protect, adminOnly, movieController.updateMovie);
// router.delete('/:id', protect, adminOnly, movieController.deleteMovie);
router.post('/', movieController.createMovie);
router.put('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router;
