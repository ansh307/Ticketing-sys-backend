const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/initiate', protect, paymentController.initiatePayment);
router.post('/verify', protect, paymentController.verifyPayment);
router.post("/refund", protect, paymentController.refundPayment);

router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
