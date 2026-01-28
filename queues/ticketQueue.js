const {Queue} = require('bullmq');
const {redisConnection, defaultJobOptions} = require("../config/redis");

const ticketQueue = new Queue('ticketQueue', {connection:redisConnection, defaultJobOptions:defaultJobOptions});

async function addTicketQueue(jobName, data) {
  await ticketQueue.add(jobName, data);
}

module.exports = {ticketQueue,addTicketQueue};

