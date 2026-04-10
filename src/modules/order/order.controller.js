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

        // ✅ 2. If rider accepted
        if (order.DPID && order.ORST === 'Accepted') {

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
            // Also update main status to reflect payment success if needed
            orderData.ORST = "Pending";
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
        // Create entry in OrderPayments
        // if (paymentData) {
        //     await OrderRepository.createOrderPayment({
        //         OID: orderId,
        //         PID: paymentData.rzp_payment_id,
        //         Amount: orderData.ORVL,
        //         Status: "PAID"
        //     });
        // }
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
