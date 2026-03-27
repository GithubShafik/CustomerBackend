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
        
        // ✅ Ensure ORCD is populated from the authenticated customer's ID
        const customerId = req.customer.customerId;
        
        console.log("🔍 DEBUG - JWT Token Contents:", JSON.stringify(req.customer, null, 2));
        console.log("🔍 DEBUG - Extracted Customer ID:", customerId);
        console.log("🔍 DEBUG - Customer ID Type:", typeof customerId);
        console.log("🔍 DEBUG - Customer ID Length:", customerId ? customerId.length : 'N/A');
        
        if (!customerId) {
            console.error("❌ Customer ID is missing from JWT token!");
            console.error("❌ Full req object keys:", Object.keys(req));
            console.error("❌ Full req.customer:", req.customer);
            return res.status(401).json({ 
                success: false, 
                message: "Customer authentication failed - no customer ID in token" 
            });
        }
        
        // Use CID from request body if provided (from frontend), otherwise use JWT token
        orderData.ORCD = orderData.CID || customerId;
        orderData.CID = orderData.CID || customerId; // Ensure both fields are set
        
        console.log("📋 Order Data ORCD after assignment:", orderData.ORCD);
        console.log("📋 Order Data CID after assignment:", orderData.CID);
        console.log("📋 Full Order Data:", JSON.stringify(orderData, null, 2));
        
        console.log("📋 Customer ID from JWT:", customerId);
        console.log("📋 Order Data ORCD before insert:", orderData.ORCD);
        console.log("📋 Full Order Data:", JSON.stringify(orderData, null, 2));
        
        const orderId = await OrderRepository.createOrder(orderData, tripData);
        console.log("✅ Order created in DB with ID:", orderId);
        console.log("✅ CID should be set to:", customerId);
        
        // Verify the order was created with correct CID
        try {
            const verifyOrder = await OrderRepository.verifyOrderCreation(orderId);
            console.log("✅ Verification - Order in DB:", {
                ORID: verifyOrder.ORID,
                ORCD: verifyOrder.ORCD,
                CID: verifyOrder.CID,
                DPID: verifyOrder.DPID
            });
        } catch (verifyError) {
            console.error("⚠️ Could not verify order creation:", verifyError.message);
        }

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
            // Deduplicate partner IDs and filter out those who already accepted
            const uniquePartnerIds = [...new Set(nearbyPartners.map(p => p.DPID))];
            
            const eventData = {
                orderId,
                pickupLocation: tripData.OTSLL,
                dropLocation: tripData.OTDLL,
                orderValue: orderData.ORVL,
                timestamp: new Date().toISOString()
            };
            
            try {
                // Determine Partner Backend URL (Defaults to localhost:8002)
                // const partnerBackendUrl = process.env.PARTNER_BACKEND_URL || 'http://localhost:8002';
                const partnerBackendUrl = 'https://dpbackend-tjvf.onrender.com';
                
                console.log(`🌉 [Cross-Backend Bridge] Sending notification to ${uniquePartnerIds.length} unique partners at ${partnerBackendUrl}...`);
                
                // Fire and forget internal API call
                fetch(`${partnerBackendUrl}/api/internal/notify-partners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partnerIds: uniquePartnerIds, eventData })
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

/**
 * POST /api/orders/accept
 * Accept an order by a delivery partner
 */
exports.acceptOrder = async (req, res) => {
    try {
        const { orderId, dpId } = req.body;

        if (!orderId || !dpId) {
            return res.status(400).json({ success: false, message: "Order ID and Partner ID are required" });
        }

        const success = await OrderRepository.acceptOrder(orderId, dpId);

        if (!success) {
            return res.status(400).json({ success: false, message: "Failed to accept order. It might already be accepted or doesn't exist." });
        }

        res.status(200).json({
            success: true,
            message: "Order accepted successfully"
        });

    } catch (error) {
        console.error("❌ Accept Order Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/orders/:id
 * Get full order and customer details
 */
exports.getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await OrderRepository.getOrderWithCustomer(id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error("❌ Get Order Details Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};