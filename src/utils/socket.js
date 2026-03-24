const { Server } = require("socket.io");

let io;
const partnerSockets = new Map(); // partner_id -> socket_id

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join", (data) => {
            // Data should contain partnerId and role
            if (data.role === 'partner' && data.partnerId) {
                const roomName = `partner_${data.partnerId}`;
                socket.join(roomName);
                console.log(`Partner ${data.partnerId} joined room ${roomName} with socket ${socket.id}`);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const getPartnerSocketId = (partnerId) => {
    return partnerSockets.get(partnerId.toString());
};

module.exports = { initSocket, getIO, getPartnerSocketId };
