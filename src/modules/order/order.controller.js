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
 * GET /api/orders/:orderId/status
 * Poll order status to check if a rider has accepted
 */
exports.getOrderStatus = async (req, res) => {
    let pool;

    try {
        const { orderId } = req.params;

        const mysql = require('mysql2/promise');
        const config = require('../../config/env');

        // ✅ Create DB pool
        pool = mysql.createPool({
            host: config.db.host,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
            port: config.db.port,
            connectionLimit: 5
        });

        // ✅ 1. Get Order
        const [orders] = await pool.execute(
            `SELECT ORID, ORST, DPID 
             FROM Orders 
             WHERE ORID = ? 
             LIMIT 1`,
            [orderId]
        );

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orders[0];

        // ✅ 2. If rider accepted (check for DPID and accepted status)
        if (order.DPID && (order.ORST === 'Accepted' || order.ORST === 'Pickup Confirmed')) {

            const [partnerRows] = await pool.execute(
                `SELECT 
                    dp.DPID,
                    dp.DPFN,
                    dp.DPMN,
                    dp.DPLN,
                    dp.DPSPIN,
                    loc.DPCLL
                 FROM DeliveryPartner dp
                 LEFT JOIN DPLocation loc 
                    ON loc.DPID = dp.DPID
                 WHERE dp.DPID = ?
                 LIMIT 1`,
                [order.DPID]
            );

            const partner = partnerRows[0];

            // ✅ Extract location
            let dpLat = null;
            let dpLng = null;

            if (partner?.DPCLL && partner.DPCLL.includes(',')) {
                const [lat, lng] = partner.DPCLL
                    .split(',')
                    .map(v => parseFloat(v.trim()));

                dpLat = lat;
                dpLng = lng;
            }

            // ✅ Extract vehicle info from JSON
            let vehicle = 'Bicycle';
            if (partner?.DPSPIN) {
                try {
                    const spinData = JSON.parse(partner.DPSPIN);
                    if (spinData.vehicleType) {
                        vehicle = `${spinData.vehicleType}${spinData.vehiclePlate ? ` (${spinData.vehiclePlate})` : ''}`.trim();
                    }
                } catch (e) {
                    console.warn('⚠️ Could not parse DPSPIN:', e.message);
                }
            }

            return res.status(200).json({
                success: true,
                status: 'Accepted',
                orderId,
                dp: {
                    id: partner?.DPID || null,
                    name: `${partner?.DPFN || ''} ${partner?.DPLN || ''}`.trim(),
                    phone: partner?.DPMN || '',
                    profileImage: null,
                    vehicle
                },
                dpLocation: dpLat !== null
                    ? { latitude: dpLat, longitude: dpLng }
                    : null
            });
        }

        // ✅ 3. If not accepted yet
        return res.status(200).json({
            success: true,
            status: order.ORST,
            orderId,
            dp: null
        });

    } catch (error) {
        console.error('❌ getOrderStatus error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });

    } finally {
        // ✅ Always close pool
        if (pool) await pool.end();
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
        const { orderData, tripData, paymentData } = req.body;

        if (!orderData || !tripData) {
             console.error("❌ Missing orderData or tripData in request");
            return res.status(400).json({ success: false, message: "Missing orderData or tripData" });
        }
        
        // Log destination contact details
        console.log('📍 Destination Contact Details in tripData:', {
            OTDN: tripData.OTDN,
            OTDO: tripData.OTDO
        });
        
        // Verify Razorpay Payment if paymentData is provided
        if (paymentData && paymentData.rzp_payment_id && paymentData.rzp_order_id && paymentData.rzp_signature) {
            const crypto = require("crypto");
            const config = require("../../config/env");
            
            const text = paymentData.rzp_order_id + "|" + paymentData.rzp_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", config.razorpay.key_secret)
                .update(text.toString())
                .digest("hex");
                
            if (expectedSignature !== paymentData.rzp_signature) {
                console.error("❌ Invalid Payment Signature");
                return res.status(400).json({ success: false, message: "Invalid payment signature" });
            }
            
            // Populate Razorpay columns in orderData
            orderData.PayStatus = "PAID";
            orderData.RzpOrderID = paymentData.rzp_order_id;
            orderData.RzpPaymentID = paymentData.rzp_payment_id;
            orderData.RzpSignature = paymentData.rzp_signature;
            // Set initial status to "Order Placed" to match OrderStatus table
            orderData.ORST = "Order Placed";
        } else {
            // Default to pending if no payment data (e.g. cash on delivery or pending payment)
            orderData.PayStatus = "PENDING";
        }

        // Set Customer ID from authenticated user
        const customerId = req.customer?.id || req.customer?.customerId;
        
        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is missing from token"
            });
        }
        
        orderData.CID = customerId;
        orderData.ORCD = customerId; // Also setting ORCD as it's used for fetching orders

         // 1. Create order in DB
          console.log("💾 Creating order in DB for customer:", customerId);
        const orderId = await OrderRepository.createOrder(orderData, tripData);
        console.log("✅ Order created in DB with ID:", orderId);
        
        // 2. Create entry in OrderPayments table
        if (paymentData && paymentData.rzp_payment_id) {
            console.log("💳 Creating OrderPayment entry...");
            
            await OrderRepository.createOrderPayment({
                ORID: orderId,                              // Order ID (REQUIRED)
                ORDS: tripData.ORDS || 0,                   // Order Distance (from frontend)
                OTID: tripData.OTID || 0,                   // Order Time ID (rate master ID)
                OTRR: tripData.OTRR || 0,                   // Order Time-based Rate
                OTFA: orderData.ORVL || 0,                  // Order Final Amount (REQUIRED)
                OTTI: paymentData.rzp_payment_id            // Transaction ID
            });
            
            console.log("✅ OrderPayment created successfully");
        } else {
            console.log("⚠️ No payment data provided, skipping OrderPayment entry");
        }
        // Get pickup coordinates for nearby riders
        const [lat, lng] = tripData.OTSLL.split(",").map(Number);

        const nearbyPartners = await OrderRepository.findNearbyPartners(lat, lng);

        if (nearbyPartners.length > 0) {
            const partnerIds = nearbyPartners.map((p) => p.DPID);

            // Fetch customer details to include in notification
            const CustomerRepository = require("../../repositories/customer.repository");
            const customerDetails = await CustomerRepository.findCustomerById(customerId);

            const eventData = {
                orderId,
                customerId,
                customerName: customerDetails ? `${customerDetails.CFN || ''} ${customerDetails.CLN || ''}`.trim() : 'Customer',
                customerPhone: customerDetails?.CDN || '',
                pickupLocation: `${tripData.OTSA1}, ${tripData.OTSC}`,
                dropLocation: `${tripData.OTDA1}, ${tripData.OTDCO}`,
                orderValue: orderData.ORVL,
            };

            try {
                 // Determine Partner Backend URL (Defaults to localhost:8001)
                const partnerBackendUrl = process.env.PARTNER_BACKEND_URL || 'http://localhost:8002';

                console.log(`🌉 [Cross-Backend Bridge] Sending notification request to ${partnerBackendUrl}...`);
                
                // Fire and forget internal API call

                fetch(`${partnerBackendUrl}/api/internal/notify-partners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partnerIds, eventData})
                })
                    .then((res) => res.json())
                    .then((data) =>
                        console.log("✅ Rider notification success:", data)
                    )
                    .catch((err) =>
                        console.error("❌ Notification failed:", err.message)
                    );
            } catch (error) {
                console.error('❌ [Cross-Backend Bridge] Error:', error.message);
            }
        }

        res.status(201).json({
            success: true,
            message: "Order booked successfully",
            orderId,
        });
    } catch (error) {
        console.error("❌ bookOrder error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getOrderRateController = async (req, res) => {
    try {
        const rate = await OrderRepository.getOrderRate();

        res.json({
            success: true,
            count: rate.length,
            data: rate
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

exports.getTermsAndConditionsController = async (req, res) => {
    try {
        const terms = await OrderRepository.getTermsAndConditions();    
        res.json({
            success: true,
            count: terms.length,
            data: terms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

/**
 * POST /api/orders/book-multi
 * Book a new multi-delivery order with multiple trips
 */
exports.bookMultiOrder = async (req, res) => {
    try {
        console.log("📥 Received bookMultiOrder request:", JSON.stringify(req.body, null, 2));
        const { orderData, tripData, paymentData } = req.body;

        if (!orderData || !tripData || !Array.isArray(tripData)) {
            console.error("❌ Missing orderData or tripData array in request");
            return res.status(400).json({ 
                success: false, 
                message: "Missing orderData or tripData array" 
            });
        }

        console.log(`📦 Creating multi-delivery order with ${tripData.length} trips`);

        // Verify Razorpay Payment if paymentData is provided
        if (paymentData && paymentData.rzp_payment_id && paymentData.rzp_order_id && paymentData.rzp_signature) {
            const crypto = require("crypto");
            const config = require("../../config/env");
            
            const text = paymentData.rzp_order_id + "|" + paymentData.rzp_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", config.razorpay.key_secret)
                .update(text.toString())
                .digest("hex");
                
            if (expectedSignature !== paymentData.rzp_signature) {
                console.error("❌ Invalid Payment Signature");
                return res.status(400).json({ success: false, message: "Invalid payment signature" });
            }
            
            // Populate Razorpay columns in orderData
            orderData.PayStatus = "PAID";
            orderData.RzpOrderID = paymentData.rzp_order_id;
            orderData.RzpPaymentID = paymentData.rzp_payment_id;
            orderData.RzpSignature = paymentData.rzp_signature;
            orderData.ORST = "Order Placed";
        } else {
            orderData.PayStatus = "PENDING";
        }

        // Set Customer ID from authenticated user
        const customerId = req.customer?.id || req.customer?.customerId;
        
        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is missing from token"
            });
        }
        
        orderData.CID = customerId;
        orderData.ORCD = customerId;

        // Create multi-delivery order in DB
        console.log("💾 Creating multi-delivery order in DB for customer:", customerId);
        const orderId = await OrderRepository.createMultiOrder(orderData, tripData);
        console.log("✅ Multi-delivery order created in DB with ID:", orderId);
        
        // Create entry in OrderPayments table
        if (paymentData && paymentData.rzp_payment_id) {
            console.log("💳 Creating OrderPayment entry for multi-delivery...");
            
            // Calculate total distance from all trips
           // Calculate total distance from all trips
const totalDistance = tripData.reduce((sum, trip) => {
    const distance = parseFloat(trip.ORDS) || 0;
    console.log(`📍 [Multi-Order Payment] Trip distance:`, distance);
    return sum + distance;
}, 0);

console.log(`💰 [Multi-Order Payment] Total distance calculated:`, totalDistance);
console.log(`💰 [Multi-Order Payment] Trip count:`, tripData.length);

await OrderRepository.createOrderPayment({
    ORID: orderId,
    ORDS: totalDistance,
    OTID: tripData[0]?.OTID || 0,
    OTRR: tripData[0]?.OTRR || 0,
    OTFA: orderData.ORVL || 0,
    OTTI: paymentData.rzp_payment_id
});
            
            console.log("✅ OrderPayment created successfully for multi-delivery with total distance:", totalDistance);
        }

        // Get pickup coordinates from first trip for nearby riders
        const [lat, lng] = tripData[0].OTSLL.split(",").map(Number);

        const nearbyPartners = await OrderRepository.findNearbyPartners(lat, lng);

        if (nearbyPartners.length > 0) {
            const partnerIds = nearbyPartners.map((p) => p.DPID);

            const CustomerRepository = require("../../repositories/customer.repository");
            const customerDetails = await CustomerRepository.findCustomerById(customerId);

            const eventData = {
                orderId,
                customerId,
                customerName: customerDetails ? `${customerDetails.CFN || ''} ${customerDetails.CLN || ''}`.trim() : 'Customer',
                customerPhone: customerDetails?.CDN || '',
                pickupLocation: `${tripData[0].OTSA1}, ${tripData[0].OTSC}`,
                dropLocation: `${tripData[tripData.length - 1].OTDA1}, ${tripData[tripData.length - 1].OTDC}`,
                orderValue: orderData.ORVL,
                numParcels: tripData.length,
                isMultiDelivery: true
            };

            try {
                const partnerBackendUrl = process.env.PARTNER_BACKEND_URL || 'http://localhost:8002';

                console.log(`🌉 [Cross-Backend Bridge] Sending multi-delivery notification to ${partnerBackendUrl}...`);
                
                fetch(`${partnerBackendUrl}/api/internal/notify-partners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partnerIds, eventData })
                })
                    .then((res) => res.json())
                    .then((data) =>
                        console.log("✅ Multi-delivery rider notification success:", data)
                    )
                    .catch((err) =>
                        console.error("❌ Multi-delivery notification failed:", err.message)
                    );
            } catch (error) {
                console.error('❌ [Cross-Backend Bridge] Error:', error.message);
            }
        }

        res.status(201).json({
            success: true,
            message: "Multi-delivery order booked successfully",
            orderId,
            numParcels: tripData.length
        });
    } catch (error) {
        console.error("❌ bookMultiOrder error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await OrderRepository.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
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
