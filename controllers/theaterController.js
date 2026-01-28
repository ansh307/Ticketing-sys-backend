const Theater = require('../models/Theater');
const { successResponse, errorResponse } = require('../utils/responseHandler');

exports.getAllTheaters = async (req, res, next) => {
  try {
    const { city } = req.query;
    const filter = city ? { city } : {};
    
    const theaters = await Theater.find(filter).populate('city');
    successResponse(res, 200, 'Theaters retrieved', { theaters });
  } catch (error) {
    next(error);
  }
};

exports.getTheaterById = async (req, res, next) => {
  try {
    const theater = await Theater.findById(req.params.id).populate('city');
    if (!theater) {
      return errorResponse(res, 404, 'Theater not found');
    }
    successResponse(res, 200, 'Theater retrieved', { theater });
  } catch (error) {
    next(error);
  }
};

exports.createTheater = async (req, res, next) => {
  try {
    const theater = await Theater.create(req.body);
    successResponse(res, 201, 'Theater created', { theater });
  } catch (error) {
    next(error);
  }
};

exports.updateTheater = async (req, res, next) => {
  try {
    const theater = await Theater.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!theater) {
      return errorResponse(res, 404, 'Theater not found');
    }
    successResponse(res, 200, 'Theater updated', { theater });
  } catch (error) {
    next(error);
  }
};

exports.deleteTheater = async (req, res, next) => {
  try {
    const theater = await Theater.findByIdAndDelete(req.params.id);
    if (!theater) {
      return errorResponse(res, 404, 'Theater not found');
    }
    successResponse(res, 200, 'Theater deleted');
  } catch (error) {
    next(error);
  }
};
