const User = require('../models/User');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const { successResponse } = require('../utils/responseHandler');
const { BOOKING_STATUS } = require('../config/constants');

exports.getDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalMovies = await Movie.countDocuments();
    const totalTheaters = await Theater.countDocuments();

    const recentBookings = await Booking.find().sort('-createdAt').limit(10).populate('user show');

    successResponse(res, 200, 'Dashboard data', {
      stats: { totalUsers, totalBookings, totalMovies, totalTheaters },
      recentBookings
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const confirmedBookings = await Booking.find({ status: BOOKING_STATUS.CONFIRMED });
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.finalAmount, 0);

    successResponse(res, 200, 'Analytics data', { totalRevenue, bookingCount: confirmedBookings.length });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');
    successResponse(res, 200, 'Users retrieved', { users });
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    successResponse(res, 200, 'User status updated', { user });
  } catch (error) {
    next(error);
  }
};

exports.adminSideMenu = async (req, res, next) => {
  try {
    const adminMenu = [
      { label: "Dashboard", path: "/admin", icon: "Building" },
      { label: "Cities", path: "/admin/city", icon: "MapPin" },
      { label: "Theaters", path: "/admin/theater", icon: "Building" },
      { label: "Shows", path: "/admin/show", icon: "Calendar" },
      { label: "Concerts", path: "/admin/concert", icon: "Film" },
      { label: "Users", path: "/admin/user", icon: "User" },
    ];

    successResponse(res, 200, "Admin Menu", { menu: adminMenu });
  } catch (err) {
    next(err);
  }
};

exports.adminMenu = async (req, res, next) => {
  try {
    const adminMenu = [
      { label: "Admin", path: "/admin", icon: "Building" }
    ];

    successResponse(res, 200, "Admin Menu", { menu: adminMenu });
  } catch (err) {
    next(err);
  }
};




