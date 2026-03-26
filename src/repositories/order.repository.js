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
            CID AS customerID
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
            OOID AS outletId,
             CID AS customerID
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
const createOrder = async (orderData, tripData,customerId) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        
        // Use Node.js crypto for GUIDs (more reliable than extra DB calls)
        const orderId = crypto.randomUUID();
        const tripId = crypto.randomUUID();

        console.log(`📦 Generated GUIDs: Order=${orderId}, Trip=${tripId}`);

        // 1. Insert Order
        const orderQuery = `
            INSERT INTO Orders (ORID, ORDT, ORVL, ORST, ORDD, ORCD, OOID, CID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(orderQuery, [
            orderId,
            orderData.ORDT,
            orderData.ORVL,
            orderData.ORST,
            orderData.ORDD,
            orderData.ORCD,
            orderData.OOID,
            customerId
        ]);

        // 2. Insert OrderTrip
        const tripQuery = `
            INSERT INTO OrderTrips (OTID, ORID, OTSLL, OTDLL, OTSD, OTDD)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(tripQuery, [
            tripId,
            orderId,
            tripData.OTSLL,
            tripData.OTDLL,
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

module.exports = {
    getOrdersByCustomerId,
    getOrdersByStatus,
    getAllOrderTypes,
    createOrder,
    findNearbyPartners
};