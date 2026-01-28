/**
 * Utility functions for emitting real-time seat updates via Socket.IO
 * This ensures consistent event structure across all seat operations
 */

/**
 * Emit seat update event to a concert room
 * @param {Object} io - Socket.IO instance
 * @param {String} concertId - Concert ID
 * @param {String} type - Update type: 'LOCKED', 'UNLOCKED', or 'BOOKED'
 * @param {Array} seats - Array of seat objects with _id, status, lockedBy, lockedAt
 */
const emitSeatUpdate = (io, concertId, type, seats) => {
  if (!io || !concertId || !seats || !Array.isArray(seats)) {
    console.warn('[SOCKET EMITTER] Missing required parameters:', { io: !!io, concertId, seats: !!seats });
    return;
  }

  const roomName = `concert-${concertId}`;
  const updateData = {
    type,
    seats: seats.map(seat => ({
      _id: seat._id?.toString() || seat.toString(),
      status: seat.status,
      lockedBy: seat.lockedBy?.toString() || seat.lockedBy || null,
      lockedAt: seat.lockedAt || null
    }))
  };

  io.to(roomName).emit('seatUpdate', updateData);
  console.log(`[SOCKET EMITTER] Emitted ${type} to ${roomName}:`, seats.length, 'seats');
};

module.exports = {
  emitSeatUpdate
};

