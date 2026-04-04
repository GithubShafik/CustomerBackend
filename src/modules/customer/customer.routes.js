const express = require("express");
const router = express.Router();

const customerController = require("./customer.controller");
const { protect } = require("../../middlewares/auth.middleware");

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Get customer details by customer ID (from JWT token)
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     middleName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     alternatePhone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     dob:
 *                       type: string
 *                     addressLine1:
 *                       type: string
 *                     addressLine2:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     postalCode:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Customer not found
 */
router.get("/profile", protect, customerController.getCustomerById);
/**
 * @swagger
 * /api/customer/profile:
 *   patch:
 *     summary: Update customer profile by customer ID (from JWT token)
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               middleName:
 *                 type: string
 *                 example: A
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               alternatePhone:
 *                 type: string
 *                 example: "9123456780"
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               dob:
 *                 type: string
 *                 example: "1995-05-20"
 *               addressLine1:
 *                 type: string
 *                 example: Street 1
 *               addressLine2:
 *                 type: string
 *                 example: Near Market
 *               city:
 *                 type: string
 *                 example: Nagpur
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               postalCode:
 *                 type: string
 *                 example: "440001"
 *     responses:
 *       200:
 *         description: Customer profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Customer updated successfully
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     middleName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     alternatePhone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     dob:
 *                       type: string
 *                     addressLine1:
 *                       type: string
 *                     addressLine2:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     postalCode:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *       400:
 *         description: Customer ID missing or invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.patch("/profile", protect, customerController.updateCustomerById);
module.exports = router;
