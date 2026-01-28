const User = require('../models/User');
const {verifyToken} = require("../utils/jwtHelper"); // your JWT secret

const extractToken = (socket) => {
    const headerToken = socket.handshake.headers.authorization || socket.handshake.headers.Authorization;
    if (headerToken && headerToken.startsWith("Bearer ")) {
        return headerToken.split(" ")[1];
    }

    const authToken = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (authToken && authToken.startsWith("Bearer ")) {
        return authToken.split(" ")[1];
    }

    return authToken || null;
};

exports.socketAuthMiddleware = async (socket, next) => {
    try {
        const token = extractToken(socket);

        if (!token) {
            return next(new Error("Unauthorized - No Token Provided"));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return next(new Error("Unauthorized - Invalid Token"));
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return next(new Error("Unauthorized - User Not Found"));
        }

        socket.user = {
            id: user._id.toString(),
            role: user.role,
        };

        next();
    } catch (err) {
        console.error("Socket authentication error:", err.message);
        next(new Error("Unauthorized - Authentication Failed"));
    }
};
