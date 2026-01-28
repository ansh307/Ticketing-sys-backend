// config/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.ACCOUNT_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

module.exports = transporter;
