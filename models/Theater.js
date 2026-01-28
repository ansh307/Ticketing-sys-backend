const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  eventKey: {
    type: String,
    required: true
  },
  pricing: [
    {
      category: { type: String, required: true },
      price: { type: Number, required: true }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  facilities: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

theaterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Theater', theaterSchema);
