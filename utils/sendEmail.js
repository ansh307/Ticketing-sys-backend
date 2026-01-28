const transporter = require('../config/nodemailer.js');
const {ticketEmailTemplates} = require('./emailTemplate');
const {ACCOUNT_EMAIL} = process.env;

const sendEmail = async (props) => {
    const {
        to, type, userName, movieName,
        eventDate,
        seats,
        price,
        currency,
        bookingId
    }  = props
    if (!to || !type) throw new Error('Missing required parameters');

    const template = ticketEmailTemplates.find((t) => t.label === type);

    if (!template) throw new Error('Invalid email type');

    const mailInfo = {
        userName,
        movieName,
        eventDate,
        seats,
        price,
        currency,
        bookingId
    };

    const message = template.generateBody(mailInfo);
    const subject = template.generateSubject(mailInfo);

    const mailOptions = {
        from: ACCOUNT_EMAIL,
        to: to,
        subject: subject,
        html: message,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) return console.log(error, 'Error sending email');
    });
};

module.exports = {sendEmail};
