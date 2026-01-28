const Review = require('../models/Review');
const Movie = require('../models/Movie');
const { successResponse, errorResponse } = require('../utils/responseHandler');

exports.createReview = async (req, res, next) => {
  try {
    const { movie, rating, comment } = req.body;

    const existingReview = await Review.findOne({ movie, user: req.user.id });
    if (existingReview) {
      return errorResponse(res, 400, 'You have already reviewed this movie');
    }

    const review = await Review.create({ movie, user: req.user.id, rating, comment });

    const reviews = await Review.find({ movie });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Movie.findByIdAndUpdate(movie, { averageRating: avgRating, totalReviews: reviews.length });

    successResponse(res, 201, 'Review created', { review });
  } catch (error) {
    next(error);
  }
};

exports.getMovieReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ movie: req.params.movieId, isApproved: true }).populate('user', 'name');
    successResponse(res, 200, 'Reviews retrieved', { reviews });
  } catch (error) {
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment || review.comment;
    await review.save();

    successResponse(res, 200, 'Review updated', { review });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }
    successResponse(res, 200, 'Review deleted');
  } catch (error) {
    next(error);
  }
};
