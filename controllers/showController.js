const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Screen = require('../models/Screen');
const { successResponse, errorResponse } = require('../utils/responseHandler');

exports.getAllShows = async (req, res, next) => {
  try {
    const { movie, theater, date } = req.query;
    const filter = {};
    
    if (movie) filter.movie = movie;
    if (theater) filter.theater = theater;
    if (date) filter.showDate = new Date(date);

    const shows = await Show.find(filter).populate('movie theater screen');
    successResponse(res, 200, 'Shows retrieved', { shows });
  } catch (error) {
    next(error);
  }
};

exports.getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id).populate('movie theater screen');
    if (!show) {
      return errorResponse(res, 404, 'Show not found');
    }
    successResponse(res, 200, 'Show retrieved', { show });
  } catch (error) {
    next(error);
  }
};

exports.createShow = async (req, res, next) => {
  try {
    const screen = await Screen.findById(req.body.screen);
    if (!screen) {
      return errorResponse(res, 404, 'Screen not found');
    }

    const show = await Show.create({ ...req.body, totalSeats: screen.totalSeats, availableSeats: screen.totalSeats });
    
    const seats = [];
    for (let row = 0; row < screen.seatLayout.rows; row++) {
      for (let col = 0; col < screen.seatLayout.columns; col++) {
        seats.push({
          show: show._id,
          seatNumber: `${String.fromCharCode(65 + row)}${col + 1}`,
          row: String.fromCharCode(65 + row),
          column: col + 1,
          seatType: 'silver',
          price: req.body.pricing.silver || 100
        });
      }
    }
    await Seat.insertMany(seats);

    successResponse(res, 201, 'Show created', { show });
  } catch (error) {
    next(error);
  }
};

exports.updateShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!show) {
      return errorResponse(res, 404, 'Show not found');
    }
    successResponse(res, 200, 'Show updated', { show });
  } catch (error) {
    next(error);
  }
};

exports.deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) {
      return errorResponse(res, 404, 'Show not found');
    }
    await Seat.deleteMany({ show: req.params.id });
    successResponse(res, 200, 'Show deleted');
  } catch (error) {
    next(error);
  }
};
