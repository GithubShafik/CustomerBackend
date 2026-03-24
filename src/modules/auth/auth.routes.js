const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *                 description: Phone number in format +91XXXXXXXXXX, 91XXXXXXXXXX or XXXXXXXXXX
 *               email:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         description: Invalid input or phone format
 *       409:
 *         description: Customer already exists
 */
router.post("/register", authController.registerCustomer);

/**
 * @swagger
 * /api/auth/register-send-otp:
 *   post:
 *     summary: Send OTP for registration/login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Phone number is required
 */
router.post("/register-send-otp", authController.registerAndSendOtp);

/**
 * @swagger
 * /api/auth/verify-login:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid OTP or expired
 *       404:
 *         description: Customer not found
 */
router.post("/verify-login", authController.verifyOtpAndLogin);

module.exports = router;