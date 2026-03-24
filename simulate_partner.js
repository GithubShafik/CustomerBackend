const { io } = require("socket.io-client");

// Change this to your backend URL if different
const SOCKET_URL = "http://localhost:5000";

// Enter the Partner ID you want to simulate (must exist in DPLocation table)
const PARTNER_ID = "1"; 

console.log(`🔌 Connecting to ${SOCKET_URL}...`);
const socket = io(SOCKET_URL);

socket.on("connect", () => {
    console.log("✅ Connected to server with Socket ID:", socket.id);

    // Join as a partner
    console.log(`📡 Sending 'join' event for Partner ID: ${PARTNER_ID}...`);
    socket.emit("join", {
        role: "partner",
        partnerId: PARTNER_ID
    });
});

// Listen for new orders
socket.on("new_order", (data) => {
    console.log("\n🚀 [NEW ORDER RECEIVED!] 🚀");
    console.log("----------------------------");
    console.log("Order ID:", data.orderId);
    console.log("Pickup:", data.pickupLocation);
    console.log("Drop:", data.dropLocation);
    console.log("Value:", data.orderValue);
    console.log("----------------------------\n");
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
});

socket.on("connect_error", (error) => {
    console.error("❗ Connection Error:", error.message);
});

console.log("⏳ Waiting for orders... (Press Ctrl+C to stop)");
