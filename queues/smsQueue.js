// bull/smsQueue.js
const {Queue} = require("bullmq");
const {REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME} = process.env;

const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
}

const defaultJobOptions = {
    removeOnComplete: true, // cleanup
    removeOnFail: false,
    attempts: 3, // retry 3 times
    backoff: {
        type: 'exponential',
        delay: 5000,
    }
}

const smsQueue = new Queue("smsQueue", {connection, defaultJobOptions});

// Function to add a job to the queue
function addSmsToQueue(data) {
    smsQueue.add("sendSms", data);

    console.log("SMS job added to queue:", data);
}

module.exports = {addSmsToQueue};
