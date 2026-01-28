const { ForbiddenError } = require('../utils/errorHandler');
const { USER_ROLES } = require('../config/constants');

/**
 * Middleware to allow only admins to access certain routes
 */
exports.adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
      console.warn(`Unauthorized access attempt by user ${req.user._id}`);
      return res.status(403).json({ status: 'error', message: 'Access denied. Admin only.' });

    }

    next();
  } catch (err) {
    next(err);
  }
};
