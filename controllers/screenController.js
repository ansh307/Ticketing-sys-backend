const Screen = require('../models/Screen');
const Theater = require('../models/Theater');
const { successResponse, errorResponse } = require('../utils/responseHandler');

exports.getAllScreens = async (req, res, next) => {
  try {
    const { theater, isActive } = req.query;
    const filter = {};
    
    if (theater) filter.theater = theater;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const screens = await Screen.find(filter).populate('theater');
    successResponse(res, 200, 'Screens retrieved', { screens });
  } catch (error) {
    next(error);
  }
};

exports.getScreenById = async (req, res, next) => {
  try {
    const screen = await Screen.findById(req.params.id).populate('theater');
    if (!screen) {
      return errorResponse(res, 404, 'Screen not found');
    }
    successResponse(res, 200, 'Screen retrieved', { screen });
  } catch (error) {
    next(error);
  }
};

exports.createScreen = async (req, res, next) => {
  try {
    const theater = await Theater.findById(req.body.theater);
    if (!theater) {
      return errorResponse(res, 404, 'Theater not found');
    }

    const screen = await Screen.create(req.body);
    successResponse(res, 201, 'Screen created', { screen });
  } catch (error) {
    next(error);
  }
};

exports.updateScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!screen) {
      return errorResponse(res, 404, 'Screen not found');
    }
    successResponse(res, 200, 'Screen updated', { screen });
  } catch (error) {
    next(error);
  }
};

exports.deleteScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findByIdAndDelete(req.params.id);
    if (!screen) {
      return errorResponse(res, 404, 'Screen not found');
    }
    successResponse(res, 200, 'Screen deleted');
  } catch (error) {
    next(error);
  }
};
