const OrderRepository = require("../../repositories/order.repository");

/**
 * GET /api/orders
 * Get all orders for logged-in customer
 */
exports.getMyOrders = async (req, res) => {
    try {
        const customerId = req.customer.customerId; // from JWT

        const orders = await OrderRepository.getOrdersByCustomerId(customerId);

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("❌ Get Orders Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/orders/status/:status
 * Get orders filtered by status
 */
exports.getOrdersByStatus = async (req, res) => {
    try {
        const customerId = req.customer.customerId;
        const { status } = req.params;

        const orders = await OrderRepository.getOrdersByStatus(customerId, status);

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("❌ Get Orders By Status Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/orders/types
 * Get all available order types
 */
exports.getOrderTypes = async (req, res) => {
    try {
        const orderTypes = await OrderRepository.getAllOrderTypes();

        res.status(200).json({
            success: true,
            count: orderTypes.length,
            orderTypes
        });

    } catch (error) {
        console.error("❌ Get Order Types Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/orders/book
 * Book a new order and notify nearby partners
 */
exports.bookOrder = async (req, res) => {
    try {
        console.log("📥 Received bookOrder request:", JSON.stringify(req.body, null, 2));
        const { orderData, tripData } = req.body;

        if (!orderData || !tripData) {
            console.error("❌ Missing orderData or tripData in request");
            return res.status(400).json({ success: false, message: "Missing orderData or tripData" });
        }

        // 1. Create order in DB
        console.log("💾 Creating order in DB...");
        const orderId = await OrderRepository.createOrder(orderData, tripData);
        console.log("✅ Order created in DB with ID:", orderId);

        // 2. Extract lat/lng from pickup location (OTSLL: "lat,lng")
        if (!tripData.OTSLL || !tripData.OTSLL.includes(',')) {
            console.error("❌ Invalid OTSLL format (expected 'lat,lng'):", tripData.OTSLL);
            return res.status(400).json({ success: false, message: "Invalid pickup location format" });
        }
        const [lat, lng] = tripData.OTSLL.split(',').map(coord => parseFloat(coord.trim()));
        console.log(`📍 Searching for partners near: ${lat}, ${lng}`);

        // 3. Find nearby active partners
        const nearbyPartners = await OrderRepository.findNearbyPartners(lat, lng);
        console.log(`🔍 Found ${nearbyPartners.length} nearby active partners`);

        // 4. Send real-time notification via cross-backend bridge
        if (nearbyPartners.length > 0) {
            const partnerIds = nearbyPartners.map(p => p.DPID);
            const eventData = {
                orderId,
                pickupLocation: tripData.OTSLL,
                dropLocation: tripData.OTDLL,
                orderValue: orderData.ORVL
            };
            
            try {
                // Determine Partner Backend URL (Defaults to localhost:8001)
                const partnerBackendUrl = process.env.PARTNER_BACKEND_URL || 'http://localhost:8001';
                
                console.log(`🌉 [Cross-Backend Bridge] Sending notification request to ${partnerBackendUrl}...`);
                
                // Fire and forget internal API call
                fetch(`${partnerBackendUrl}/api/internal/notify-partners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partnerIds, eventData })
                })
                .then(res => res.json())
                .then(data => console.log('✅ [Cross-Backend Bridge] Success:', data))
                .catch(err => console.error('❌ [Cross-Backend Bridge] Failed:', err.message));
                
            } catch (error) {
                console.error('❌ [Cross-Backend Bridge] Error:', error.message);
            }
        } else {
            console.log('⚠️ No active partners found nearby. Skipping notifications.');
        }

        res.status(201).json({
            success: true,
            message: "Order booked and partners processed",
            orderId,
            notifiedPartnersCount: nearbyPartners.length,
            partnersFound: nearbyPartners.map(p => p.DPID)
        });

    } catch (error) {
        console.error("❌ Book Order Final Catch Block Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error during booking",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};