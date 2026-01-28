const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', bookingController.createBooking);

router.get("/all", bookingController.getAllUserBooking);

router.get('/', protect, bookingController.getUserBookings);

router.post(
    "/download/:id",
    protect,
    (req, res, next) => {
        res.removeHeader("Content-Encoding");
        next();
    },
    bookingController.downloadLatestBookingPDF
);

router.get('/lastest', protect, bookingController.getLatestUserBooking);

router.get('/:id', protect, bookingController.getBookingById);

router.post('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
