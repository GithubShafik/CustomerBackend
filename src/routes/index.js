const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const locationRoutes = require("../modules/location/location.routes");

router.use("/auth", authRoutes);
router.use("/location", locationRoutes);
router.use("/orders", require("../modules/order/order.routes"));

router.get("/ping", async (req, res) => {
    try {
        const { connection } = require("../config/db");
        await connection.query("SELECT 1");
        res.json({ success: true, message: "Server and DB are alive!" });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;