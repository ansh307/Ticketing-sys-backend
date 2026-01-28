const express = require('express');
const { createPaymentIntent } = require('../controllers/stripeController');
const router = express.Router();

router.post("/", createPaymentIntent);

module.exports = router;
