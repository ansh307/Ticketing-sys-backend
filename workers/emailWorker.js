// workers/emailWorker.js
const { Worker } = require('bullmq');
const { ticketEmailTemplates } = require("../utils/emailTemplate");
const { sendEmail } = require("../config/sendGrid");
const { redisConnection } = require("../config/redis");

const emailWorker = new Worker(
    'emailQueue',
    async (job) => {
        const { to, type, ...data } = job.data;
        const template = ticketEmailTemplates.find(t => t.label === type);
        if (!template) throw new Error(`Email template not found for type: ${type}`);

        const msg = {
            to,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: template.generateSubject(data),
            html: template.generateBody(data),
        };

        await sendEmail(msg);
        console.log(`Email sent to ${to} for ${type}`);
    },
    {
        connection: redisConnection
    }
);


emailWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
});

emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

module.exports = emailWorker;
