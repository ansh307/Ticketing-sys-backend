const Coupon = require('../models/Coupon');
const { successResponse, errorResponse } = require('../utils/responseHandler');

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) {
      return errorResponse(res, 404, 'Invalid coupon code');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return errorResponse(res, 400, 'Coupon has expired or not yet valid');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse(res, 400, 'Coupon usage limit reached');
    }

    if (amount < coupon.minAmount) {
      return errorResponse(res, 400, `Minimum amount ${coupon.minAmount} required`);
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }

    successResponse(res, 200, 'Coupon valid', { coupon, discount });
  } catch (error) {
    next(error);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    successResponse(res, 201, 'Coupon created', { coupon });
  } catch (error) {
    next(error);
  }
};

exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    successResponse(res, 200, 'Coupons retrieved', { coupons });
  } catch (error) {
    next(error);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) {
      return errorResponse(res, 404, 'Coupon not found');
    }
    successResponse(res, 200, 'Coupon updated', { coupon });
  } catch (error) {
    next(error);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return errorResponse(res, 404, 'Coupon not found');
    }
    successResponse(res, 200, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
};
