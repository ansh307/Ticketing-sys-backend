const {Queue} = require('bullmq');
const {redisConnection, defaultJobOptions} = require("../config/redis");

const emailQueue = new Queue('emailQueue', {
    connection: redisConnection,
    defaultJobOptions: defaultJobOptions,
});

function addEmailToQueue(data) {
    emailQueue.add('sendEmail', {
        to: data.email,
        type: data.type, 
        userName: data.userName,
        eventName: data.eventName,
        eventDate: data.eventDate,
        seats: data.seats,
        price: data.price,
        location:data?.location,
        theaterName:data?.theaterName,
        showTime:data?.showTime,
        seatNumbers:data?.seatNumbers,
    });
}


module.exports = {addEmailToQueue};
