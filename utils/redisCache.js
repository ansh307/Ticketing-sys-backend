const redisClient = require('../config/redis');
const logger = require('./logger');
const { DEFAULT_EXPIRY } = require('../config/constants');

exports.setCache = async (key, value, expiry = DEFAULT_EXPIRY) => {
  try {
    await redisClient.setEx(key, expiry, JSON.stringify(value));
  } catch (err) {
    logger.error('Redis SET error:', err);
  }
};

exports.getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('Redis GET error:', err);
    return null;
  }
};


exports.delCache = async (pattern) => {
  try {
    // If the key is a regex pattern (like /^movies_page_/)
    if (pattern instanceof RegExp) {
      const allKeys = await redisClient.keys('*');
      const matchingKeys = allKeys.filter(key => pattern.test(key));

      if (matchingKeys.length > 0) {
        await redisClient.del(matchingKeys);
        logger.info(`Deleted ${matchingKeys.length} Redis keys matching pattern ${pattern}`);
      } else {
        logger.info(`No Redis keys matched pattern ${pattern}`);
      }
    } else {
      await redisClient.del(pattern);
      logger.info(`Deleted Redis key: ${pattern}`);
    }
  } catch (err) {
    logger.error('Redis DEL error:', err);
  }
};
