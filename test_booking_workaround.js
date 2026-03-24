const { createOrder } = require('./src/repositories/order.repository');
const dotenv = require('dotenv');
dotenv.config();

async function testBooking() {
    console.log("🧪 Testing Booking Workaround...");
    
    const testOrderData = {
        ORDT: new Date().toISOString().slice(0, 19).replace('T', ' '),
        ORVL: 150.00,
        ORST: "TestPending",
        ORDD: "",
        ORCD: "TEST_CUST",
        OOID: 999
    };

    const testTripData = {
        OTSLL: "19.0760,72.8777",
        OTDLL: "19.0522,72.8856",
        OTSD: new Date().toISOString().slice(0, 19).replace('T', ' '),
        OTDD: ""
    };

    try {
        const orderId = await createOrder(testOrderData, testTripData);
        console.log(`✅ Success! Created Order ID: ${orderId}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Test Failed:", error.message);
        process.exit(1);
    }
}

testBooking();
