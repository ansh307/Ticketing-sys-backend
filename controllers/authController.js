const User = require('../models/User');
const { generateToken } = require('../utils/jwtHelper');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { ValidationError } = require('../utils/errorHandler');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already registered');
    }

    const user = await User.create({ name, email, password, phone });
    const token = generateToken({ id: user._id });

    successResponse(res, 201, 'Registration successful', { user: { id: user._id, name, email,role:user.role }, token });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken({ id: user._id });
    successResponse(res, 200, 'Login successful', { user: { id: user._id, name: user.name, email: user.email,role:user.role }, token });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    successResponse(res, 200, 'User retrieved', { user });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    successResponse(res, 200, 'Logout successful');
  } catch (error) {
    next(error);
  }
};
