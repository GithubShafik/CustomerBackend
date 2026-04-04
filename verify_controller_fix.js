const orderController = require("./src/modules/order/order.controller");
const OrderRepository = require("./src/repositories/order.repository");

// Mock req, res
const req = {
    body: {
        orderData: {
            ORDT: "2026-03-31 18:30:00",
            ORVL: 500
        },
        tripData: {
            OTSLL: "19.0760,72.8777",
            OTDLL: "19.0522,72.8856",
            OTSD: "2026-03-31 18:35:00"
        }
    },
    customer: {
        customerId: "CUST_12345"
    }
};

const res = {
    status: function(s) { this.statusCode = s; return this; },
    json: function(j) { this.data = j; return this; }
};

// Mock Repository to avoid actual DB calls if needed, OR just spy on it
const originalCreateOrder = OrderRepository.createOrder;
OrderRepository.createOrder = async (orderData, tripData) => {
    console.log("🛠️ Mock Repository received orderData:", JSON.stringify(orderData, null, 2));
    if (orderData.CID === "CUST_12345" && orderData.ORCD === "CUST_12345") {
        console.log("✅ Verification Passed: CID and ORCD are correctly set!");
    } else {
        console.log("❌ Verification Failed: CID or ORCD missing/incorrect.");
        process.exit(1);
    }
    return "MOCK_ORDER_ID";
};

// Mock findNearbyPartners
OrderRepository.findNearbyPartners = async () => [];

async function test() {
    console.log("🧪 Starting Controller Verification...");
    await orderController.bookOrder(req, res);
    console.log("🏁 Test Finished.");
    process.exit(0);
}

test();
