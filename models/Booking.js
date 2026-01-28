const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../config/constants');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  concertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concert',
    required: true,
  },
  seats: [
    {
      seatId: { type: String, required: true },
      label: { type: String }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  lockedAt: {
    type: Date,
    default: Date.now
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  qrCode: String,
  ticketPdf: String,
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    }
  }

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
