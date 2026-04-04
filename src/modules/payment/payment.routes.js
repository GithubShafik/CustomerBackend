const express = require("express");
const router = express.Router();
const paymentController = require("./payment.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Route to create a Razorpay order
router.post("/create-order", protect, paymentController.createOrder);

// Route to render Razorpay checkout HTML
router.get("/checkout", paymentController.renderCheckout);

// Route to verify payment signature
router.post("/verify", protect, paymentController.verifyPayment);

module.exports = router;
