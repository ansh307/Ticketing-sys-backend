const seatHandler = require("./handlers/seatHandler");
const {socketAuthMiddleware} = require("../middleware/socketMiddleware");

module.exports = (io) => {
    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Attach seat-specific handlers
        seatHandler(io, socket);

        socket.on("joinShow", (showId) => {
            socket.join(`show-${showId}`);
        });

        socket.on("leaveShow", (showId) => {
            socket.leave(`show-${showId}`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });


    return io;
};
