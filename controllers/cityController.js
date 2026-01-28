const City = require('../models/City');
const { successResponse, errorResponse } = require('../utils/responseHandler');

exports.getAllCities = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = isActive !== undefined ? { isActive } : {};

    const cities = await City.find(filter);
    successResponse(res, 200, 'Cities retrieved', { cities });
  } catch (error) {
    next(error);
  }
};

exports.getCityById = async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return errorResponse(res, 404, 'City not found');
    }
    successResponse(res, 200, 'City retrieved', { city });
  } catch (error) {
    next(error);
  }
};

exports.createCity = async (req, res, next) => {
  try {
    const city = await City.create(req.body);
    successResponse(res, 201, 'City created', { city });
  } catch (error) {
    next(error);
  }
};

exports.updateCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!city) {
      return errorResponse(res, 404, 'City not found');
    }
    successResponse(res, 200, 'City updated', { city });
  } catch (error) {
    next(error);
  }
};

exports.deleteCity = async (req, res, next) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) {
      return errorResponse(res, 404, 'City not found');
    }
    successResponse(res, 200, 'City deleted');
  } catch (error) {
    next(error);
  }
};
