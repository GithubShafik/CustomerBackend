const mysql = require("mysql2/promise");
const config = require("../config/env");
const crypto = require("crypto");

const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    port: config.db.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
});

/**
 * Get all orders for a specific customer
 */
const getOrdersByCustomerId = async (customerId) => {
    const query = `
        SELECT 
            ORID AS orderId,
            ORDT AS orderDate,
            ORVL AS orderValue,
            ORST AS orderStatus,
            ORDD AS deliveryDate,
            ORCD AS orderCode,
            OOID AS outletId
        FROM Orders
        WHERE ORCD = ?
        ORDER BY ORDT DESC
    `;
    const [results] = await pool.execute(query, [customerId]);
    return results;
};

/**
 * Get orders filtered by status
 */
const getOrdersByStatus = async (customerId, status) => {
    const query = `
        SELECT 
            ORID AS orderId,
            ORDT AS orderDate,
            ORVL AS orderValue,
            ORST AS orderStatus,
            ORDD AS deliveryDate,
            ORCD AS orderCode,
            OOID AS outletId
        FROM Orders
        WHERE ORCD = ? AND ORST = ?
        ORDER BY ORDT DESC
    `;
    const [results] = await pool.execute(query, [customerId, status]);
    return results;
};

/**
 * Get all available order types
 */
const getAllOrderTypes = async () => {
    const query = `
        SELECT 
            OTYP AS typeId,
            OTDS AS typeDescription
        FROM OrderTypes
        ORDER BY OTDS ASC
    `;
    const [results] = await pool.execute(query);
    return results;
};

/**
 * Create a new order and trip (GUID from MySQL)
 */
const createOrder = async (orderData, tripData) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Use Node.js crypto for GUIDs (more reliable than extra DB calls)
        const orderId = crypto.randomUUID();
        const tripId = crypto.randomUUID();

        console.log(`📦 Generated GUIDs: Order=${orderId}, Trip=${tripId}`);

        // 1. Insert Order
        const orderQuery = `
    INSERT INTO Orders (
        ORID, ORDT, ORVL, ORST, ORDD, ORCD, OOID, DPID, CID, AttID, OWt, PayStatus, RzpOrderID, RzpPaymentID, RzpSignature
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

       await connection.execute(orderQuery, [
    orderId,
    orderData.ORDT || null,
    orderData.ORVL || 0,
    orderData.ORST || "Pending",
    orderData.ORDD || "",
    orderData.ORCD || null,
    orderData.OOID || "",  // Empty string instead of null
    orderData.DPID || null,
    orderData.CID || null,
    orderData.AttID || null,
    orderData.OWt || null,
    orderData.PayStatus || "PENDING",
    orderData.RzpOrderID || null,
    orderData.RzpPaymentID || null,
    orderData.RzpSignature || null
]);

        // 2. Insert OrderTrip
        const tripQuery = `
            INSERT INTO OrderTrips (
                OTID, ORID, OTSLL, OTDLL, 
                OTSA1, OTSA2, OTSA3, OTSC, OTSZ, OTSS, OTSCO,
                OTDA1, OTDA2, OTDA3, OTDC, OTDZ, OTDS, OTDCO,
                OTSD, OTDD
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(tripQuery, [
            tripId,
            orderId,
            tripData.OTSLL,
            tripData.OTDLL,
            tripData.OTSA1 || "",
            tripData.OTSA2 || "",
            tripData.OTSA3 || "",
            tripData.OTSC || "",
            tripData.OTSZ || "",
            tripData.OTSS || "",
            tripData.OTSCO || "",
            tripData.OTDA1 || "",
            tripData.OTDA2 || "",
            tripData.OTDA3 || "",
            tripData.OTDC || "",
            tripData.OTDZ || "",
            tripData.OTDS || "",
            tripData.OTDCO || "",
            tripData.OTSD,
            tripData.OTDD
        ]);

        await connection.commit();
        return orderId;
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error creating order:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Find nearby partners (within 2km)
 */
const findNearbyPartners = async (lat, lng) => {
    const query = `
        SELECT DPID, 
               (6371 * acos(
                   cos(radians(?)) 
                   * cos(radians(CAST(TRIM(SUBSTRING_INDEX(DPCLL, ',', 1)) AS DECIMAL(10,8))))
                   * cos(radians(CAST(TRIM(SUBSTRING_INDEX(DPCLL, ',', -1)) AS DECIMAL(11,8))) - radians(?)) 
                   + sin(radians(?)) 
                   * sin(radians(CAST(TRIM(SUBSTRING_INDEX(DPCLL, ',', 1)) AS DECIMAL(10,8))))
               )) AS distance
        FROM DPLocation
        WHERE DPSTA = 1
        HAVING distance <= 2
        ORDER BY distance;
    `;

    const [results] = await pool.execute(query, [lat, lng, lat]);
    return results;
};

const getOrderRate = async () => {
    const connection = await pool.getConnection();
    try {
        const query = `
            SELECT 
                OTID  AS orderTimeId,
                OTWS  AS startTime,
                OTWE  AS endTime,
                OTWN  AS windowName,
                OWWF  AS weatherFactor,
                OWWD  AS weatherDescription,
                OTRA  AS rate,
                ORDU  AS distanceUomId
            FROM OrderRateMaster
            WHERE ORDU IS NOT NULL
            ORDER BY OTWS
        `;

        const [rows] = await connection.execute(query);
        return rows;

    } finally {
        connection.release();
    }
};

const getTermsAndConditions = async () => {
    const connection = await pool.getConnection();
    try {
        const query = `
            SELECT 
                TCCU AS customerTnC,
                TCDP AS deliveryPartnerTnC,
                TCPG AS paymentGatewayTnC
            FROM PDTnC
            LIMIT 1
        `;

        const [rows] = await connection.execute(query);
        return rows[0];

    } finally {
        connection.release();
    }
};
module.exports = {
    getOrdersByCustomerId,
    getOrdersByStatus,
    getAllOrderTypes,
    createOrder,
    findNearbyPartners,
    getOrderRate,
    getTermsAndConditions
};