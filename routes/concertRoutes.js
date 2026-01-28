const express = require('express');
const multer = require('multer');

const concertController = require('../controllers/concertController.js');
const { protect } = require('../middleware/authMiddleware.js');
const { adminOnly } = require('../middleware/adminMiddleware.js');
const { upload } = require('../middleware/uploadMiddleware.js');

const router = express.Router();

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum file size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message || 'File upload error',
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'File upload error',
    });
  }
  next();
};

// Routes with file upload support
router.route('/')
  .get(concertController.getConcerts)
  .post(
    concertController.createConcert
  );

router.route('/:id')
  .get(concertController.getConcertById)
  .put(
    concertController.updateConcert
  )
  .delete(concertController.deleteConcert);

module.exports = router;