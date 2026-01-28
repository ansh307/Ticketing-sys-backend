const mongoose = require('mongoose');
const { SEAT_STATUS } = require('../config/constants');

const seatSchema = new mongoose.Schema({
  concertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concert',
    required: true,
  },
  seatNumber: {
    type: String,
    required: true
  },
  row: {
    type: String,
    required: true
  },
  column: {
    type: Number,
    required: true
  },
  seatType: {
    type: String,
    enum: ['gold', 'silver', 'platinum'],
    required: true
  },
  status: {
    type: String,
    enum: Object.values(SEAT_STATUS),
    default: SEAT_STATUS.AVAILABLE
  },
  price: {
    type: Number,
    required: true
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: Date,
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
}, { timestamps: true });

seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
