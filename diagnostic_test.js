const OrderRepository = require("./src/repositories/order.repository");
const { initSocket } = require("./src/utils/socket");
const http = require("http");

async function runTest() {
    console.log("🚀 Starting Order Booking Diagnostic Test...\n");

    const testOrderData = {
        ORDT: new Date().toISOString().slice(0, 19).replace('T', ' '),
        ORVL: 150.00,
        ORST: "Pending",
        ORDD: new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '),
        ORCD: "",
        OOID: 1
    };

    const testTripData = {
        OTSLL: "19.0760,72.8777", // Mumbai pickup
        OTDLL: "19.0522,72.8856",
        OTSD: new Date().toISOString().slice(0, 19).replace('T', ' '),
        OTDD: new Date(Date.now() + 1800000).toISOString().slice(0, 19).replace('T', ' ')
    };

    try {
        // 1. Test Database Connection and Table Verification
        console.log("--- Step 1: Database Operations ---");
        console.log("Attempting to create order...");
        const orderId = await OrderRepository.createOrder(testOrderData, testTripData);
        console.log(`✅ Order created successfully! Order ID: ${orderId}`);

        // 2. Test Partner Finding
        console.log("\n--- Step 2: Partner Finding (Haversine) ---");
        const [lat, lng] = testTripData.OTSLL.split(',').map(coord => parseFloat(coord.trim()));
        console.log(`Searching for partners near ${lat}, ${lng}...`);
        const partners = await OrderRepository.findNearbyPartners(lat, lng);
        console.log(`Found ${partners.length} partners nearby.`);
        if (partners.length > 0) {
            console.log("Partner Details:", partners);
        } else {
            console.log("⚠️ No partners found within 2km. Check DPLocation table data.");
        }

        // 3. Test Socket Logic
        console.log("\n--- Step 3: Socket.IO Check ---");
        const server = http.createServer();
        const io = initSocket(server);
        console.log("✅ Socket.io initialized successfully.");

    } catch (error) {
        console.error("\n❌ DIAGNOSTIC FAILED:", error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        process.exit();
    }
}

runTest();
