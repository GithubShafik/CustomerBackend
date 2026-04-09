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
    
    if (!customerId || !orderId) {
        console.warn("[Internal Bridge] ⚠️ Missing customerId or orderId in payload:", req.body);
        return res.status(400).json({ success: false, error: "Missing customerId or orderId" });
    }

    try {
        const io = getIO();
        const roomName = `customer_${customerId}`;
        
        io.to(roomName).emit("order_accepted", {
            orderId,
            dp,
            dpLocation,
            estimatedTime
        });
        
        console.log(`[Internal Bridge] 🔔 EMITTED 'order_accepted' to room ${roomName}`);
        res.status(200).json({ success: true, message: "Customer notified successfully" });
    } catch (error) {
        console.error("[Internal Bridge] ❌ SOCKET ERROR:", error.message);
        res.status(500).json({ success: false, error: "Internal socket error" });
    }
});

// Main Routes
app.use('/api', router);

// Error Handler
app.use(errorMiddleware);

module.exports = app;
