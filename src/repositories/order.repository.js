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

        // 1. Insert Order - Ensure CID is populated from ORCD (customer ID) and DPID is NULL
        const orderQuery = `
            INSERT INTO Orders (ORID, ORDT, ORVL, ORST, ORDD, ORCD, CID, OOID, DPID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        `;
        
        // Validate that ORCD is actually populated before inserting
        if (!orderData.ORCD || orderData.ORCD === '') {
            console.error("❌ CRITICAL ERROR: orderData.ORCD is empty or missing!");
            console.error("❌ This means customerId was not set properly in order.controller.js");
            throw new Error("Customer ID (ORCD) is missing - cannot create order without customer reference");
        }
        
        console.log("💉 Inserting Order with values:", {
            orderId,
            ORDT: orderData.ORDT || new Date(),
            ORVL: orderData.ORVL,
            ORST: orderData.ORST || 'Pending',
            ORDD: orderData.ORDD,
            ORCD: orderData.ORCD,
            CID: orderData.ORCD, // Should be same as ORCD
            OOID: orderData.OOID
        });
        
        await connection.execute(orderQuery, [
            orderId,
            orderData.ORDT || new Date(),
            orderData.ORVL,
            orderData.ORST || 'Pending',
            orderData.ORDD,
            orderData.ORCD,
            orderData.ORCD, // CID = Customer ID (same as ORCD)
            orderData.OOID
        ]);
        
        console.log("✅ Order inserted successfully with CID:", orderData.ORCD);

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
        SELECT DISTINCT DPID, 
               (6371 * acos(
                   cos(radians(?)) 
                   * cos(radians(CAST(TRIM(SUBSTRING_INDEX(DPCLL, ',', 1)) AS DECIMAL(10,8))))
                   * cos(radians(CAST(TRIM(SUBSTRING_INDEX(DPCLL, ',', -1)) AS DECIMAL(11,8))) - radians(?)) 
                   + sin(radians(?)) 
                   * sin(radians(CAST(TRIM(SUBSTRING_INDEX(DPCLL, ',', 1)) AS DECIMAL(10,8))))
               )) AS distance
        FROM DPLocation
        WHERE DPSTA = 1
        GROUP BY DPID
        HAVING distance <= 2
        ORDER BY distance;
    `;

    const [results] = await pool.execute(query, [lat, lng, lat]);
    return results;
};

/**
 * Accept an order by updating status and assigning partner
 */
const acceptOrder = async (orderId, dpId) => {
    const query = `
        UPDATE Orders 
        SET ORST = 'Accepted', DPID = ?
        WHERE ORID = ? AND (ORST = 'Pending' OR ORST IS NULL)
    `;
    const [result] = await pool.execute(query, [dpId, orderId]);
    return result.affectedRows > 0;
};

/**
 * Get full order details including customer and trip info
 */
const getOrderWithCustomer = async (orderId) => {
    const query = `
        SELECT 
            o.ORID AS orderId,
            o.ORDT AS orderDate,
            o.ORVL AS orderValue,
            o.ORST AS orderStatus,
            o.DPID AS partnerId,
            o.ORCD AS orderCustomerId,
            o.CID AS customerId,
            t.OTSLL AS pickupLocation,
            t.OTDLL AS dropLocation,
            c.CFN AS customerFirstName,
            c.CLN AS customerLastName,
            c.CDN AS customerPhone,
            c.CID AS customerActualId
        FROM Orders o
        LEFT JOIN OrderTrips t ON o.ORID = t.ORID
        LEFT JOIN Customers c ON (o.CID = c.CID OR o.ORCD = c.CID)
        WHERE o.ORID = ?
    `;
    const [results] = await pool.execute(query, [orderId]);
    return results[0];
};

/**
 * Verify order was created correctly with all required fields
 */
const verifyOrderCreation = async (orderId) => {
    const query = `
        SELECT ORID, ORCD, CID, DPID, ORST 
        FROM Orders 
        WHERE ORID = ?
    `;
    const [results] = await pool.execute(query, [orderId]);
    return results[0];
};

module.exports = {
    getOrdersByCustomerId,
    getOrdersByStatus,
    getAllOrderTypes,
    createOrder,
    findNearbyPartners,
    acceptOrder,
    getOrderWithCustomer,
    verifyOrderCreation
};