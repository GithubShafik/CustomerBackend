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
    orderData.ORST || "Order Placed",  // Changed from "Pending" to "Order Placed"
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
                OTSD, OTDD, OTDN, OTDO
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Debug log
        console.log('📝 Inserting OrderTrip with values:', {
            tripId, orderId,
            OTSLL: tripData.OTSLL,
            OTDLL: tripData.OTDLL,
            OTDN: tripData.OTDN,
            OTDO: tripData.OTDO
        });
        
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
            tripData.OTDD,
            tripData.OTDN || "",
            tripData.OTDO || ""
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
 * Create a new order with multiple trips (GUID from MySQL)
 */
const createMultiOrder = async (orderData, tripsData) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Use Node.js crypto for GUIDs
        const orderId = crypto.randomUUID();

        console.log(`📦 Generated Order ID for multi-delivery: ${orderId}`);
        console.log(`📦 Creating ${tripsData.length} trips for this order`);

        // 1. Insert Order (single order for all trips)
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
            orderData.ORST || "Order Placed",
            orderData.ORDD || "",
            orderData.ORCD || null,
            orderData.OOID || "",
            orderData.DPID || null,
            orderData.CID || null,
            orderData.AttID || null,
            orderData.OWt || null,
            orderData.PayStatus || "PENDING",
            orderData.RzpOrderID || null,
            orderData.RzpPaymentID || null,
            orderData.RzpSignature || null
        ]);

        // 2. Insert multiple OrderTrips
        for (let i = 0; i < tripsData.length; i++) {
            const tripData = tripsData[i];
            const tripId = crypto.randomUUID();

            console.log(`📝 [Multi-Order] Creating trip ${i + 1}/${tripsData.length}: ${tripId}`);
            console.log(`📍 [Multi-Order] Trip ${i + 1} details:`, {
                pickup: tripData.OTSA1,
                destination: tripData.OTDA1,
                pickupCoords: tripData.OTSLL,
                destinationCoords: tripData.OTDLL,
                destinationName: tripData.OTDN,
                destinationContact: tripData.OTDO
            });

            const tripQuery = `
                INSERT INTO OrderTrips (
                    OTID, ORID, OTSLL, OTDLL, 
                    OTSA1, OTSA2, OTSA3, OTSC, OTSZ, OTSS, OTSCO,
                    OTDA1, OTDA2, OTDA3, OTDC, OTDZ, OTDS, OTDCO,
                    OTSD, OTDD, OTDN, OTDO
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                tripData.OTDD,
                tripData.OTDN || "",
                tripData.OTDO || ""
            ]);
            
            console.log(`✅ [Multi-Order] Trip ${i + 1} inserted successfully`);
        }

        await connection.commit();
        console.log(`✅ Multi-delivery order created successfully with ${tripsData.length} trips`);
        return orderId;
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error creating multi-delivery order:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Create entry in OrderPayments table
 */
const createOrderPayment = async (paymentData) => {
    const connection = await pool.getConnection();

    try {
        console.log('💳 Creating OrderPayment entry:', {
            ORID: paymentData.ORID,
            ORDS: paymentData.ORDS,
            OTID: paymentData.OTID,
            OTRR: paymentData.OTRR,
            OTFA: paymentData.OTFA
        });

        // Generate unique OPID (15 chars)
        const opId = `OP${Date.now().toString().slice(-13)}`;
        
        const paymentQuery = `
            INSERT INTO OrderPayments (
                OPID, ORID, ORDS, OTID, OTRR, OTDS, OTFA, OTPM, OTTI, OPST, ODSID, OPDT, OPTIP
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(paymentQuery, [
            opId,                                    // OPID - Auto-generated
            paymentData.ORID,                        // ORID - Order ID (REQUIRED)
            parseFloat(paymentData.ORDS) || 0,      // ORDS - Order Distance
            paymentData.OTID || 0,                   // OTID - Order Time ID (from rate master)
            paymentData.OTRR || 0,                   // OTRR - Order Time-based Rate
            0,                                       // OTDS - Order Trip Distance (not needed)
            paymentData.OTFA || 0,                   // OTFA - Order Final Amount (REQUIRED)
            1,                                       // OTPM - Payment Mode (1=Online)
            paymentData.OTTI || '',                  // OTTI - Transaction ID
            1,                                       // OPST - Payment Status (1=Success)
            '',                                      // ODSID - Delivery Status ID
            new Date(),                              // OPDT - Payment DateTime
            0                                        // OPTIP - Tip Amount
        ]);

        console.log('✅ OrderPayment created successfully:', opId);
        return opId;

    } catch (error) {
        console.error('❌ Error creating OrderPayment:', error);
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

const getOrderById = async (orderId) => {
    const orderQuery = `
        SELECT
            o.ORID AS orderId,
            o.ORDT AS orderDate,
            o.ORVL AS orderValue,
            o.ORST AS orderStatus,
            o.ORDD AS deliveryDate,
            o.ORCD AS orderCode,
            o.OOID AS outletId,
            o.DPID AS partnerId,
            o.PayStatus AS paymentStatus,
            o.RzpOrderID AS rzpOrderId,
            dp.DPFN AS partnerFirstName,
            dp.DPLN AS partnerLastName,
            dp.DPMN AS partnerPhone,
            dp.DPSPIN AS partnerVehicleInfo
        FROM Orders o
        LEFT JOIN DeliveryPartner dp ON o.DPID = dp.DPID
        WHERE o.ORID = ?
    `;
 
    const tripQuery = `
        SELECT
            OTID AS tripId,
            OTSLL AS pickupLatLng,
            OTDLL AS dropLatLng,
            OTSA1 AS pickupAddress1,
            OTSA2 AS pickupAddress2,
            OTSA3 AS pickupAddress3,
            OTSC AS pickupCity,
            OTSZ AS pickupZip,
            OTSS AS pickupState,
            OTSCO AS pickupCountry,
            OTDA1 AS dropAddress1,
            OTDA2 AS dropAddress2,
            OTDA3 AS dropAddress3,
            OTDC AS dropCity,
            OTDZ AS dropZip,
            OTDS AS tripDistance,
            OTDCO AS dropCountry,
            OTDN AS recipientName,
            OTDO AS recipientPhone
        FROM OrderTrips
        WHERE ORID = ?
    `;
 
    const [orderResults] = await pool.execute(orderQuery, [orderId]);
    if (orderResults.length === 0) return null;
 
    const [tripResults] = await pool.execute(tripQuery, [orderId]);
   
    // Parse vehicle info if available
    const order = orderResults[0];
    if (order.partnerVehicleInfo) {
        try {
            order.partnerVehicleInfo = JSON.parse(order.partnerVehicleInfo);
        } catch (e) {
            order.partnerVehicleInfo = null;
        }
    }
   
    return {
        ...order,
        trips: tripResults
    };
};
 
module.exports = {
    getOrdersByCustomerId,
    getOrdersByStatus,
    getAllOrderTypes,
    createOrder,
    createMultiOrder,
    createOrderPayment,
    findNearbyPartners,
    getOrderRate,
    getTermsAndConditions,
    getOrderById
};