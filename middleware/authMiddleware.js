const { verifyToken } = require('../utils/jwtHelper');
const { UnauthorizedError } = require('../utils/errorHandler');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Please login to access this resource');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
