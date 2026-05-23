                                                                                                                                                                                                                                            const express = require('express');
const cors = require('cors');
const router = require('./routes/index');
const errorMiddleware = require('./middlewares/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const swaggerDocs = require('./config/swagger');
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Serve local fallback uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Internal Bridge for Cross-Backend Communication
const { getIO } = require('./utils/socket');
app.post('/api/internal/customer/notify-accepted', (req, res) => {
    const { customerId, orderId, dp, dpLocation, estimatedTime } = req.body;
    console.log(`[Internal Bridge] 📥 RECEIVED acceptance for order ${orderId}, customer ${customerId}`);
    console.log(`[Internal Bridge] 📦 Full payload:`, JSON.stringify(req.body, null, 2));
    
    if (!customerId || !orderId) {
        console.warn("[Internal Bridge] ⚠️ Missing customerId or orderId in payload:", req.body);
        return res.status(400).json({ success: false, error: "Missing customerId or orderId" });
    }

    try {
        const io = getIO();
        const roomName = `customer_${customerId}`;
        
        console.log(`[Internal Bridge] 🔔 Emitting 'order_accepted' to room ${roomName}`);
        console.log(`[Internal Bridge] 📤 Event data:`, JSON.stringify({ orderId, dp, dpLocation, estimatedTime }, null, 2));
        
        io.to(roomName).emit("order_accepted", {
            orderId,
            dp,
            dpLocation,
            estimatedTime
        });
        
        console.log(`[Internal Bridge] ✅ Successfully emitted event to room ${roomName}`);
        res.status(200).json({ success: true, message: "Customer notified successfully" });
    } catch (error) {
        console.error("[Internal Bridge] ❌ SOCKET ERROR:", error.message);
        res.status(500).json({ success: false, error: "Internal socket error" });
    }
});

// Internal Bridge for Order Status Updates
app.post('/api/internal/customer/notify-status-update', (req, res) => {
    const { customerId, orderId, status, dp, dpLocation, estimatedTime } = req.body;
    console.log(`[Status Bridge] 📥 RECEIVED status update for order ${orderId}: ${status}`);
    console.log(`[Status Bridge] 📦 Customer: ${customerId}`);
    
    if (!customerId || !orderId || !status) {
        console.warn("[Status Bridge] ⚠️ Missing required fields:", req.body);
        return res.status(400).json({ success: false, error: "Missing customerId, orderId, or status" });
    }

    try {
        const io = getIO();
        const roomName = `customer_${customerId}`;
        
        console.log(`[Status Bridge] 🔔 Emitting 'order_status_updated' to room ${roomName}`);
        console.log(`[Status Bridge] 📤 Event data:`, JSON.stringify({ orderId, status, dp, dpLocation, estimatedTime }, null, 2));
        
        io.to(roomName).emit("order_status_updated", {
            orderId,
            status,
            dp,
            dpLocation,
            estimatedTime
        });
        
        console.log(`[Status Bridge] ✅ Successfully emitted event to room ${roomName}`);
        res.status(200).json({ success: true, message: "Customer notified of status update" });
    } catch (error) {
        console.error("[Status Bridge] ❌ SOCKET ERROR:", error.message);
        res.status(500).json({ success: false, error: "Internal socket error" });
    }
});


// Internal Bridge for Real-Time Location Updates
app.post('/api/internal/customer/notify-location', async (req, res) => {
    const { orderId, latitude, longitude } = req.body;
    console.log(`[Location Bridge] 📥 RECEIVED location update for order ${orderId}: lat=${latitude}, lng=${longitude}`);
    
    if (!orderId || !latitude || !longitude) {
        return res.status(400).json({ success: false, error: "Missing required location data" });
    }

    try {
        const io = getIO();
        
        // Find customerId for this order
        const OrderRepository = require('./repositories/order.repository');
        const order = await OrderRepository.getOrderById(orderId);
        
        if (order && order.CID) {
            const customerId = order.CID;
            const roomName = `customer_${customerId}`;
            
            io.to(roomName).emit("dp_location_update", {
                orderId,
                latitude,
                longitude
            });
            console.log(`[Location Bridge] 🔔 Emitted 'dp_location_update' to room ${roomName}`);
        } else {
            console.warn(`[Location Bridge] ⚠️ No customer found for order ${orderId}`);
        }

        res.status(200).json({ success: true, message: "Location update processed" });
    } catch (error) {
        console.error("[Location Bridge] ❌ ERROR:", error.message);
        res.status(500).json({ success: false, error: "Internal error" });
    }
});

// Main Routes
app.use('/api', router);

// Error Handler
app.use(errorMiddleware);

module.exports = app;
