const {Worker} = require('bullmq');
const {redisConnection} = require("../config/redis");
const {sendShowReminderQueueEmail} = require("../utils/emailHandler");

const worker = new Worker(
    "reminderQueue",
    async (job) => {
        const {user} = job.data;

        const data = {
            email: user.email,
            type: "Show Starting Soon",
            userName: user.userName,
            eventName: user.eventName,
            theaterName: user.theaterName,
            seatNumbers: user.seatNumbers,
            showTime: user.showTime,
            location: user.location,
        }
        sendShowReminderQueueEmail(data);
        console.log(`Reminder event triggered for ${user.name} - ${user.name}`);
    },
    {connection: redisConnection}
);

