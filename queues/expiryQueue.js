const {Queue} = require('bullmq');
const logger = require('../utils/logger');
const {redisConnection, defaultJobOptions} = require("../config/redis");

const expiryQueue = new Queue('bookingExpiry', {
    connection: redisConnection,
    defaultJobOptions: defaultJobOptions
});

expiryQueue.jobExists = async (bookingId) => {
    const job = await expiryQueue.getJob(`expiry_${bookingId}`);
    return job !== null;
}

// remove expiry job (payment done)
expiryQueue.removeExpiryJob = async (bookingId) => {
    const job = await expiryQueue.getJob(`expiry_${bookingId}`);
    if (job) {
        await job.remove();
        logger.info(`Expiry job removed for booking: ${bookingId}`);
    }
}

module.exports = expiryQueue;