const express = require("express");
const router = express.Router();
const orderController = require("./order.controller");
const { protect } = require("../../middlewares/auth.middleware");

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders for logged-in customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, orderController.getMyOrders);

/**
 * @swagger
 * /api/orders/status/{status}:
 *   get:
 *     summary: Get orders filtered by status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered orders
 *       401:
 *         description: Unauthorized
 */
router.get("/status/:status", protect, orderController.getOrdersByStatus);

/**
 * @swagger
 * /api/orders/types:
 *   get:
 *     summary: getOrderTypes
 *     description: Get all available order types (Regular, Secure, Special)
 *     operationId: getOrderTypes
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of order types
 *       500:
 *         description: Internal server error
 */
router.get("/types", orderController.getOrderTypes);

/**
 * @swagger
 * /api/orders/book:
 *   post:
 *     summary: Book a new order and notify nearby partners
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderData
 *               - tripData
 *             properties:
 *               orderData:
 *                 type: object
 *                 description: Order details
 *                 properties:
 *                   ORDT: { type: string, description: "Order Date Time", example: "2026-03-18 18:30:00" }
 *                   ORVL: { type: number, description: "Order Value", example: 500 }
 *                   ORST: { type: string, description: "Order Status", example: "Pending" }
 *                   ORDD: { type: string, description: "Delivery Date Time", example: "2026-03-18 20:00:00" }
 *                   ORCD: { type: string, description: "Cancel Date Time", example: "" }
 *                   OOID: { type: integer, description: "Old Order Ref ID", example: 1 }
 *               tripData:
 *                 type: object
 *                 description: Trip details
 *                 properties:
 *                   OTSLL: { type: string, description: "Pickup Lat,Lng", example: "19.0760,72.8777" }
 *                   OTDLL: { type: string, description: "Drop Lat,Lng", example: "19.0522,72.8856" }
 *                   OTSD: { type: string, description: "Start Date Time", example: "2026-03-18 18:35:00" }
 *                   OTDD: { type: string, description: "End Date Time", example: "2026-03-18 19:45:00" }
 *     responses:
 *       201:
 *         description: Order booked successfully
 *       500:
 *         description: Internal server error
 */
router.post("/book", protect, orderController.bookOrder);

/**
 * @swagger
 * /api/orders/book-multi:
 *   post:
 *     summary: Book a new multi-delivery order with multiple trips
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderData
 *               - tripData
 *             properties:
 *               orderData:
 *                 type: object
 *                 description: Order details
 *               tripData:
 *                 type: array
 *                 description: Array of trip details for each delivery segment
 *                 items:
 *                   type: object
 *               paymentData:
 *                 type: object
 *                 description: Payment verification data
 *     responses:
 *       201:
 *         description: Multi-delivery order booked successfully
 *       500:
 *         description: Internal server error
 */
router.post("/book-multi", protect, orderController.bookMultiOrder);

/**
 * GET /api/orders/:orderId/status — Poll order acceptance status
 */
router.get("/:orderId/status", protect, orderController.getOrderStatus);

/**
 * @swagger
 * /api/orders/order-rate:
 *   get:
 *     summary: Get current order rate based on time window
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Current order rate fetched successfully
 */
router.get("/order-rate", orderController.getOrderRateController);

/**
 * @swagger
 * /api/orders/terms-and-conditions:
 *   get:
 *     summary: Get Terms and Conditions
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Terms and Conditions fetched successfully
 */
router.get("/terms-and-conditions", orderController.getTermsAndConditionsController);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get detailed information for a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:orderId", protect, orderController.getOrderDetails);

module.exports = router;