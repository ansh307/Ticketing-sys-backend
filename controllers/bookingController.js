const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const Coupon = require('../models/Coupon');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { BOOKING_STATUS, SEAT_STATUS } = require('../config/constants');
const { generateQRCode } = require('../utils/qrCodeGenerator');
const { getCache, delCache } = require('../utils/redisCache');
const { sendBookingCancellationSms, sendBookingConfirmationSMS } = require("../utils/smsHandler");
const { sendCancellationBookingEmail, sendBookingConfirmationEmail } = require("../utils/emailHandler");
const expiryQueue = require('../queues/expiryQueue');
const PDFDocument = require("pdfkit");

// const ticketQueue = require('../queues/ticketQueue');

//old code
// exports.createBooking = async (req, res, next) => {
//   try {
//     const { showId, seatIds } = req.body;

//     const seats = await Seat.find({ _id: { $in: seatIds }, show: showId });

//     if (seats.length !== seatIds.length) {
//       return errorResponse(res, 400, 'Invalid seats selected');
//     }

//     for (const seat of seats) {
//       if (seat.status !== SEAT_STATUS.RESERVED || seat.lockedBy.toString() !== req.user.id) {
//         return errorResponse(res, 400, `Seat ${seat.seatNumber} is not reserved by you`);
//       }
//     }

//     const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
//     const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

//     const booking = await Booking.create({
//       bookingId,
//       user: req.user.id,
//       show: showId,
//       seats: seatIds,
//       totalAmount,
//       finalAmount: totalAmount,
//       status: BOOKING_STATUS.PENDING
//     });

//     const qrCode = await generateQRCode({ bookingId, userId: req.user.id, showId, seats: seatIds });
//     booking.qrCode = qrCode;
//     await booking.save();

//     successResponse(res, 201, 'Booking created', { booking });
//   } catch (error) {
//     next(error);
//   }
// };


exports.createBooking = async (req, res, next) => {
    const session = await mongoose.startSession();
    const userId = req.user._id;
    session.startTransaction();

    try {
        const { concertId, seatIds } = req.body;

        const seats = await Seat.find({
            _id: { $in: seatIds },
            concertId
        }).session(session);

        if (seats.length !== seatIds.length) {
            await session.abortTransaction();
            return errorResponse(res, 400, 'Invalid seats selected');
        }

        const unavailableSeats = [];
        for (const seat of seats) {
            // const redisKey = `seat_lock:${seat._id}`;
            // const lockedBy = await getCache(redisKey);

            if (seat.status !== SEAT_STATUS.AVAILABLE && seat.status !== SEAT_STATUS.RESERVED) {
                unavailableSeats.push(`Seat ${seat.seatNumber} is not available`);
                continue;
            }

            if (seat.lockedBy !== userId) {
                unavailableSeats.push(`Seat ${seat.seatNumber} is not reserved by you`);
            }
        }

        if (unavailableSeats.length > 0) {
            await session.abortTransaction();
            return errorResponse(res, 400, 'Seat reservation failed', { unavailableSeats });
        }

        const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
        const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const booking = await Booking.create([{
            bookingId,
            user: userId,
            concertId,
            seats: seatIds,
            totalAmount,
            finalAmount: totalAmount,
            status: BOOKING_STATUS.PENDING,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }], { session });

        await Seat.updateMany(
            { _id: { $in: seatIds } },
            {
                status: SEAT_STATUS.RESERVED,
                lockedBy: null,
                lockedAt: null,
                booking: booking[0]._id
            },
            { session }
        );

        await session.commitTransaction();

        for (const seat of seats) {
            const redisKey = `seat_lock:${seat._id}`;
            await delCache(redisKey);
        }

        await expiryQueue.add(
            'deleteExpiredBooking',
            {
                bookingId: booking[0]._id,
                seatIds: seatIds,
                concertId
            },
            {
                delay: 10 * 60 * 1000, // 10 minutes
                jobId: `expiry_${booking[0]._id}`,
                removeOnComplete: true
            }
        );

        const data = {
            email: user.email,
            userName: user.name,
            phone: user.phone,
            eventName: "",
            seats: "",
            price: ""
        }

        sendBookingConfirmationEmail(data);
        sendBookingConfirmationSMS(data);
        successResponse(res, 201, 'Booking created. Proceed to payment', {
            booking: booking[0],
            paymentRequired: true
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

exports.getUserBookings = async (req, res, next) => {

    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('concertId').sort('-createdAt');
        successResponse(res, 200, 'Bookings retrieved', { bookings });
    } catch (error) {
        next(error);
    }
};

exports.getAllUserBooking = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
        successResponse(res, 200, 'Bookings retrieved', { bookings });
    } catch (error) {
        next(error);
    }
};


exports.getBookingById = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'concertId',
                populate: {
                    path: 'theaterId',   // populate theaterId inside concert
                    select: 'name address city facilities' // optional: select only needed fields
                }
            })
            .populate('seats user'); // keep seats and user population as is

        if (!booking) {
            return errorResponse(res, 404, 'Booking not found');
        }

        successResponse(res, 200, 'Booking retrieved', { booking });
    } catch (error) {
        next(error);
    }
};


exports.getLatestUserBooking = async (req, res, next) => {
    try {
        const latestBooking = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(1)
            .populate({
                path: 'concertId',
                populate: {
                    path: 'theaterId',
                    select: 'name address city facilities'
                }
            })
            .populate('seats user');

        if (!latestBooking || latestBooking.length === 0) {
            return res.status(404).json({ success: false, message: 'No bookings found' });
        }

        successResponse(res, 200, 'Latest booking retrieved', { booking: latestBooking[0] });
    } catch (error) {
        next(error);
    }
};




exports.downloadLatestBookingPDF = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'concertId',
        populate: {
          path: 'theaterId',
          select: 'name address city location'
        }
      })
      .populate('seats user');

    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    const concert = booking.concertId;
    const theater = concert.theaterId;
    const seatNumbers = booking.seats.map(s => s.seatNumber).join(", ");

    const filename = `Booking-${booking._id}.pdf`;
    const doc = new PDFDocument({ autoFirstPage: true });

    // Set proper headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");

    // Pipe to response
    doc.pipe(res);

    // PDF content
    doc.fontSize(22).text("🎟 Booking Ticket", { align: "center" }).moveDown();
    doc.fontSize(14).text(`Booking ID: ${booking._id}`);
    doc.text(`Event: ${concert.title}`);
    doc.text(`Venue: ${theater.name}`);
    doc.text(`Location: ${theater.location}`);
    doc.text(`User: ${booking.user.name}`);
    doc.text(`Seats: ${seatNumbers}`);
    doc.text(`Total Price: ₹${booking.totalAmount}`);
    doc.text(`Date: ${new Date(booking.createdAt).toLocaleString()}`);
    doc.text(`Show Time: ${new Date(concert.startTime).toLocaleString()}`);

    // End the PDF document
    doc.end();

    // Handle stream completion
    doc.on("finish", () => {
      // Response will be automatically closed when the stream ends
      // This is just for logging/debugging if needed
    });

    // Handle errors during PDF generation
    doc.on("error", (err) => {
      console.error("PDF generation error:", err);
      if (!res.headersSent) {
        res.status(500).send("Failed to generate PDF");
      } else {
        res.end();
      }
    });

  } catch (err) {
    console.error("PDF ERROR:", err);
    if (!res.headersSent) {
      res.status(500).send("Failed to generate PDF");
    }
  }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const user = req.user;
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return errorResponse(res, 404, 'Booking not found');
        }

        if (booking.user.toString() !== req.user.id) {
            return errorResponse(res, 403, 'Not authorized');
        }

        if (booking.status === BOOKING_STATUS.CANCELLED) {
            return errorResponse(res, 400, 'Booking already cancelled');
        }

        booking.status = BOOKING_STATUS.CANCELLED;

        const data = {
            email: user.email,
            userName: user.name,
            phone: user.phone
        }
        await booking.save();
        sendCancellationBookingEmail(data);
        sendBookingCancellationSms(data);


        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: SEAT_STATUS.AVAILABLE, booking: null, lockedBy: null, lockedAt: null }
        );

        await Show.findByIdAndUpdate(booking.show, { $inc: { availableSeats: booking.seats.length } });

        successResponse(res, 200, 'Booking cancelled successfully');
    } catch (error) {
        next(error);
    }
};
