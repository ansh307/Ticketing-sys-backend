const {Queue} = require('bullmq');
const {redisConnection, defaultJobOptions} = require("../config/redis");

const paymentQueue = new Queue('paymentQueue', {connection: redisConnection, defaultJobOptions: defaultJobOptions});

async function addPaymentQueue() {
    await paymentQueue.add('myJobName', {foo: 'bar'});
}

module.export = addPaymentQueue;
