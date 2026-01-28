// Background worker for processing SMS jobs
// worker/emailWorker.js
const {Worker} = require('bullmq');
const {sendSMS} = require("../config/twillo");
const {redisConnection} = require("../config/redis");

const smsWorker = new Worker(
    'smsQueue',
    async (job) => {
        await sendSMS(job.data.to, job.data.message);
    },
    {
        connection:redisConnection,
    }
);

