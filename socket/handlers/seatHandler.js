const { SEAT_STATUS } = require("../../config/constants");

/**
 * Seat-specific socket event handlers
 * Handles real-time seat updates for concerts
 */
module.exports = function seatHandler(io, socket) {
    /**
     * Join a concert room to receive real-time seat updates
     */
    socket.on("joinConcert", (concertId) => {
        const roomName = `concert-${concertId}`;
        socket.join(roomName);
        console.log(`✅ User ${socket.user?.id} (${socket.id}) joined ${roomName}`);
    });

    /**
     * Leave a concert room
     */
    socket.on("leaveConcert", (concertId) => {
        const roomName = `concert-${concertId}`;
        socket.leave(roomName);
        console.log(`👋 User ${socket.user?.id} (${socket.id}) left ${roomName}`);
    });

    // Legacy support for show-based rooms (if needed)
    socket.on("joinShow", (showId) => {
        const roomName = `show-${showId}`;
        socket.join(roomName);
        console.log(`✅ User ${socket.user?.id} (${socket.id}) joined ${roomName}`);
    });

    socket.on("leaveShow", (showId) => {
        const roomName = `show-${showId}`;
        socket.leave(roomName);
        console.log(`👋 User ${socket.user?.id} (${socket.id}) left ${roomName}`);
    });
};

