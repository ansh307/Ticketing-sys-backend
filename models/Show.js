const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  screen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screen',
    required: true
  },
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  showDate: {
    type: Date,
    required: true
  },
  showTime: {
    type: String,
    required: true
  },
  pricing: {
    gold: Number,
    silver: Number,
    platinum: Number
  },
  totalSeats: {
    type: Number,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

showSchema.index({ movie: 1, theater: 1, showDate: 1 });

module.exports = mongoose.model('Show', showSchema);
