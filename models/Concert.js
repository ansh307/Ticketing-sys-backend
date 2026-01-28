const mongoose = require('mongoose');

const ConcertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Concert title is required.'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Concert description is required.'],
      maxlength: [5000, 'Description cannot be more than 5000 characters.'],
    },
    artist: {
      type: String,
      required: [true, 'Artist name is required.'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required.'],
      enum: ['Pop', 'Rock', 'Classical', 'Jazz', 'Electronic', 'Hip Hop', 'Other'],
      default: 'Other',
    },

    // Timing
    startTime: {
      type: Date,
      required: [true, 'Start time is required.'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required.'],
      validate: {
        validator: function (value) {
          return !this.startTime || value > this.startTime;
        },
        message: 'End time ({VALUE}) must be after the start time.',
      },
    },

    // Relationship
    theaterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Theater ID is required to host the concert.'],
    },

    // Ticketing
    totalTickets: {
      type: Number,
      required: [true, 'Total tickets are required.'],
      min: [1, 'There must be at least 1 ticket.'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base ticket price is required.'],
      min: [0, 'Base price cannot be negative.'],
      default: 0,
    },
    availableTickets: {
      type: Number,
      default: function () {
        return this.totalTickets;
      },
      min: [0, 'Available tickets cannot be negative.'],
    },

    // Media
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // optional Cloudinary public ID
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String
    },

    additionalDetails: {
      type: String,
      maxlength: [2000, 'Additional details cannot exceed 2000 characters.'],
    },

    tags: [String], // optional array of tags for filtering/search
  },
  {
    timestamps: true,
    collection: 'concerts',
  }
);

// Pre-hook for update validation
ConcertSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.startTime && update.endTime && update.endTime <= update.startTime) {
    return next(new Error('End time must be after start time.'));
  }
  next();
});

module.exports = mongoose.model('Concert', ConcertSchema);
