const Razorpay = require("razorpay");
const crypto = require("crypto");
const config = require("../../config/env");

exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ success: false, message: "Amount is required" });
        }

        if (!config.razorpay.key_id || !config.razorpay.key_secret) {
            return res.status(500).json({ success: false, message: "Razorpay credentials not configured in backend" });
        }

        const razorpayInstance = new Razorpay({
            key_id: config.razorpay.key_id,
            key_secret: config.razorpay.key_secret
        });

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);

        if (!order) {
            return res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
        }

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error("❌ Razorpay Create Order Error:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

exports.renderCheckout = (req, res) => {
    const { order_id, amount, callback_url } = req.query;

    if (!order_id || !amount || !callback_url) {
        return res.status(400).send("Missing required parameters for checkout");
    }

    const keyId = config.razorpay.key_id;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PeddalDrop Payment Interface</title>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f7f9fc; margin: 0; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #667EEA; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            p { margin-top: 20px; color: #555; }
        </style>
    </head>
    <body>
        <div style="text-align:center;">
            <div class="loader"></div>
            <p>Loading Secure Checkout...</p>
        </div>

        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
            var options = {
                "key": "${keyId}",
                "amount": "${amount}", 
                "currency": "INR",
                "name": "PeddalDrop",
                "description": "Order Payment",
                "image": "https://i.imgur.com/3g7nmJC.png",
                "order_id": "${order_id}",
                "handler": function (response){
                    // Auto redirect to callback url on success
                    var redirectUrl = "${callback_url}?razorpay_payment_id=" + response.razorpay_payment_id + 
                                      "&razorpay_order_id=" + response.razorpay_order_id + 
                                      "&razorpay_signature=" + response.razorpay_signature;
                    window.location.href = redirectUrl;
                },
                "modal": {
                    "ondismiss": function(){
                        // User cancelled payment
                        window.location.href = "${callback_url}?error=payment_cancelled";
                    }
                },
                "theme": {
                    "color": "#667EEA"
                }
            };
            var rzp1 = new Razorpay(options);
            
            // Auto open the Razorpay checkout
            window.onload = function() {
                rzp1.open();
            }
        </script>
    </body>
    </html>
    `;

    res.send(html);
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required payment verification parameters" 
            });
        }

        // Verify signature
        const text = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", config.razorpay.key_secret)
            .update(text.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            console.error("❌ Invalid Payment Signature");
            return res.status(400).json({ 
                success: false, 
                message: "Invalid payment signature" 
            });
        }

        res.json({
            success: true,
            message: "Payment verified successfully",
            paymentId: razorpay_payment_id
        });
    } catch (error) {
        console.error("❌ Payment Verification Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Payment verification failed", 
            error: error.message 
        });
    }
};
