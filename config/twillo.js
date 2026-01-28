import twilio from "twilio";
import {ValidationError} from "../utils/errorHandler.js";

// const {ValidationError} = require("../utils/errorHandler");

const {TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, MESSAGING_SID} = process.env;

// Validate Twilio credentials once at startup
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new ValidationError("Twilio credentials are missing in environment variables.");
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const sendSMS = async (to, body) => {
    if (!to) throw new ValidationError("Recipient phone number is required.");
    if (!body) throw new ValidationError("Message body is required.");
    if (!MESSAGING_SID) throw new ValidationError("Twilio Messaging SID missing.");

    const recipients = Array.isArray(to) ? to : [to];

    const msgOptions = (recipient) => ({
        body,
        messagingServiceSid: MESSAGING_SID,
        to: recipient,
    });

    try {
        await Promise.all(
            recipients.map((recipient) => client.messages.create(msgOptions(recipient)))
        );
    } catch (error) {
        throw new ValidationError("Failed to send SMS: " + error.message);
    }
};
