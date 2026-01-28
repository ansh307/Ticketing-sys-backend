const User = require('../models/User');
const { successResponse } = require('../utils/responseHandler');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    successResponse(res, 200, 'Profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone }, { new: true, runValidators: true });
    successResponse(res, 200, 'Profile updated', { user });
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    successResponse(res, 200, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};


exports.updateUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, role, isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, phone, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return errorResponse(res, 404, 'User not found');

    successResponse(res, 200, 'User updated', { user });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) return errorResponse(res, 404, 'User not found');

    successResponse(res, 200, 'User deleted');
  } catch (error) {
    next(error);
  }
};


exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId).select('+password');
    if (!user) return errorResponse(res, 404, 'User not found');

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    successResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password') // hide password
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    successResponse(res, 200, 'Users retrieved', { users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};