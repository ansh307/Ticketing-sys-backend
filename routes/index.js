const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const movieRoutes = require('./movieRoutes');
const theaterRoutes = require('./theaterRoutes');
const showRoutes = require('./showRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const searchRoutes = require('./searchRoutes');
const adminRoutes = require('./adminRoutes');
const couponRoutes = require('./couponRoutes');
const reviewRoutes = require('./reviewRoutes');
const cityRoutes = require('./cityRoutes');
const screenRoutes = require('./screenRoutes');
const concertRoutes = require('./concertRoutes')
const stripeRoutes = require('./stripeRoutes');
const webhookRoute = require('./webhookRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/movies', movieRoutes);
router.use('/theaters', theaterRoutes);
router.use('/shows', showRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/screens', screenRoutes);
router.use('/city', cityRoutes);
router.use('/concert', concertRoutes);
router.use('/stripe', stripeRoutes);


module.exports = router;
