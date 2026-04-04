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
            // Data should contain role and id
            const { role, partnerId, customerId } = data;
            
            if (role === 'partner' || partnerId) {
                const id = partnerId || customerId; // some devices might mix up ID keys
                const roomName = `partner_${id}`;
                socket.join(roomName);
                console.log(`✅ Partner ${id} joined room ${roomName}`);
            } else if (role === 'customer' || customerId) {
                const id = customerId || data.id;
                const roomName = `customer_${id}`;
                socket.join(roomName);
                console.log(`✅ Customer ${id} joined room ${roomName}`);
            } else {
                console.warn("⚠️ Unknown join attempt:", data);
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
