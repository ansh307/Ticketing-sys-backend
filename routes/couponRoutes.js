const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/validate', protect, couponController.validateCoupon);
router.post('/', protect, adminOnly, couponController.createCoupon);
router.get('/', protect, adminOnly, couponController.getAllCoupons);
router.put('/:id', protect, adminOnly, couponController.updateCoupon);
router.delete('/:id', protect, adminOnly, couponController.deleteCoupon);

module.exports = router;
