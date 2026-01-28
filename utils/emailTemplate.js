const generateBookingEmailTemplate = (data) => `
  <h2>Hi ${data.userName},</h2>
  <p>Your booking for <strong>${data.eventName}</strong> is confirmed.</p>
  <p>Booking Details:</p>
  <ul>
    <li>Event: ${data.eventName}</li>
    <li>Date: ${data.eventDate}</li>
    <li>Seats: ${data.seats}</li>
    <li>Price: ${data.price}</li>
  </ul>
  <p>Thank you for booking with us!</p>
`;

const generateBookingCancelTemplate = (data) => `
  <h2>Hi ${data.userName},</h2>
  <p>We're sorry to inform you that your booking for <strong>${data.eventName}</strong> has been canceled.</p>
  <p>Cancellation Details:</p>
  <ul>
    <li>Event: ${data.eventName}</li>
    <li>Seats: ${data.seats}</li>
    <li>Refund Amount: ${data.price}</li>
  </ul>
  <p>If you have any questions, please contact our support team.</p>
`;

const generatePaymentEmailTemplate = (data) => `
  <h2>Payment Received</h2>
  <p>Hi ${data.userName},</p>
  <p>We have successfully received your payment for <strong>${data.eventName}</strong>.</p>
  <p>Payment Details:</p>
  <ul>
    <li>Amount: ${data.price}</li>
    <li>Payment Method: ${data.paymentMethod}</li>
    <li>Booking ID: ${data.bookingId}</li>
  </ul>
  <p>Thank you for using our service!</p>
`;

const generatePaymentFailedTemplate = (data) => `
  <div style="font-family: Arial, sans-serif; color:#333; padding:20px;">
    <h2 style="color:#dc3545;">Payment Failed </h2>
    <p>Hi <strong>${data.userName}</strong>,</p>
    <p>Unfortunately, your payment for <strong>${data.movieName}</strong> was not successful.</p>

    <ul>
      <li><strong>Amount:</strong> ₹${data.price}</li>
      <li><strong>Booking ID:</strong> ${data.bookingId}</li>
    </ul>

    <p>Please try again to confirm your booking before your seats are released.</p>
    <a href="${data.paymentLink}" style="background:#dc3545; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none;">
      Retry Payment
    </a>
    <hr>
    <p style="font-size:12px; color:#888;">Need help? Contact our support team.</p>
  </div>
`;

const generateReminderSeatBookEmailTemplate = (data) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
    <h2 style="color: #6C63FF;">Complete Your Booking Before Time Runs Out! ⏰</h2>

    <p>Hi <strong>${data.userName}</strong>,</p>
    <p>Your seats are still reserved for <strong>${data.eventName}</strong> — but only for a limited time.</p>

    <div style="background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <p><strong>🎥 Movie:</strong> ${data.movieName}</p>
      <p><strong>🏢 Theatre:</strong> ${data.theatreName}</p>
      <p><strong>💺 Seats:</strong> ${data.seatNumbers}</p>
      <p><strong>💰 Amount:</strong> ₹${data.price}</p>
      <p><strong>📅 Booking ID:</strong> ${data.bookingId}</p>
      <p><strong>⏱️ Time left:</strong> ${data.remainingMinutes} minutes</p>
    </div>

    <p>Click the button below to complete your booking before your reserved seats are released:</p>

    <a href="${data.paymentLink}" 
       style="display:inline-block; background:#6C63FF; color:#fff; padding:10px 20px; 
              border-radius:6px; text-decoration:none; font-weight:bold;">
      Complete Booking Now
    </a>

    <p style="margin-top:20px;">If you’re still facing issues, please contact our support team for help.</p>

    <hr style="margin:20px 0; border:none; border-top:1px solid #eee;">
    <p style="font-size:12px; color:#888;">Thank you for choosing Ticketing ️</p>
  </div>
`;

const generateShowStartingSoonTemplate = (data) => `
  <div style="font-family: Arial, sans-serif; color:#333; padding:20px;">
    <h2 style="color:#007bff;">Your Movie Starts Soon! 🎥</h2>
    <p>Hi <strong>${data.userName}</strong>,</p>
    <p>Your show <strong>${data.eventName}</strong> starts in <strong>30 minutes</strong> at <strong>${data.theaterName}</strong>.</p>

    <div style="background:#f9f9f9; padding:15px; border-radius:8px;">
      <p><strong>🕒 Show Time:</strong> ${data.showTime}</p>
      <p><strong>💺 Seats:</strong> ${data.seatNumbers}</p>
      <p><strong>📍 Location:</strong> ${data.location}</p>
    </div>

    <p>Arrive early to grab snacks and get comfortable 🍿</p>
    <hr>
    <p style="font-size:12px; color:#888;">Team Ticketing</p>
  </div>
`;

const ticketEmailTemplates = [
  {
    label: "Booking Confirmation",
    generateSubject: (data) => `Your Ticket for ${data.eventName} is Confirmed!`,
    generateBody: (data) => generateBookingEmailTemplate(data),
  },
  {
    label: "Seat Lock Reminder",
    generateSubject: (data) => `Your selected seats for ${data.eventName} are reserved for a limited time.`,
    generateBody: (data) => generateReminderSeatBookEmailTemplate(data),
  }, {
    label: "Show Starting Soon",
    generateSubject: (data) => `Your selected seats for ${data.eventName} are reserved for a limited time.`,
    generateBody: (data) => generateShowStartingSoonTemplate(data),
  },
  {
    label: "Booking Cancellation",
    generateSubject: (data) => `Your Booking for ${data.eventName} Has Been Canceled`,
    generateBody: generateBookingCancelTemplate,
  },
  {
    label: "Payment Received",
    generateSubject: (data) => `💰 Payment Received for ${data.eventName}`,
    generateBody: generatePaymentEmailTemplate,
  },
  {
    label: "Payment REFUND",
    generateSubject: (data) => `💰 Payment Refunded for ${data.eventName}`,
    generateBody: generatePaymentEmailTemplate,
  },
  {
    label: "Payment Failed",
    generateSubject: (data) => `⚠️ Payment Failed for ${data.eventName}`,
    generateBody: generatePaymentFailedTemplate,
  },
];

module.exports = { ticketEmailTemplates };
