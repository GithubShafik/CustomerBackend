const express = require('express');
const router = express.Router();
const locationController = require('./location.controller');

/**
 * @swagger
 * /api/location/route:
 *   post:
 *     summary: Get route between two locations
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 */
router.post('/route', locationController.getRoute);

module.exports = router;
