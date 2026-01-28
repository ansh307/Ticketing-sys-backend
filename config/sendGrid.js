// src/services/sendgrid/sendEmail.js
const sgMail = require("@sendgrid/mail");
const {SENDGRID_API_KEY, ACCOUNT_EMAIL} = process.env;
sgMail.setApiKey(SENDGRID_API_KEY);

async function sendEmail({to, subject, html}) {
    const msg = {
        to,
        from: {
            name: "Ticketing",
            email: ACCOUNT_EMAIL
        },
        subject,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${to} (${subject})`);
    } catch (error) {
        console.error("SendGrid Error:", error.response?.body || error.message);
        throw error;
    }
}

module.exports = {sendEmail};
