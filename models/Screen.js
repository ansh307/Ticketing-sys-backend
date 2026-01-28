const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  seatLayout: {
    rows: Number,
    columns: Number,
    layout: [[String]]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Screen', screenSchema);
