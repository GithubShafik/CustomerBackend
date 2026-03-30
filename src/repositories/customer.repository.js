const mysql = require("mysql2/promise");
const config = require("../config/env");

// Create connection pool
const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    port: config.db.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Find customer by phone with +91 fallback
 */
const findCustomerByPhone = async (phone) => {
    try {
        let query = "SELECT * FROM Customers WHERE CDN = ?";
        let [results] = await pool.execute(query, [phone]);

        if (results[0]) return results[0];

        if (phone.startsWith("+91")) {
            const withoutCode = phone.substring(3);
            [results] = await pool.execute(query, [withoutCode]);
            if (results[0]) return results[0];
        } else {
            const withCode = `+91${phone}`;
            [results] = await pool.execute(query, [withCode]);
            if (results[0]) return results[0];
        }

        return null;
    } catch (error) {
        console.error("findCustomerByPhone error:", error);
        return null;
    }
};

/**
 * Generate unique customer ID
 */
const generateCustomerId = () => {
    const timestamp = Date.now().toString().slice(-5);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `C${timestamp}${random}`;
};

/**
 * Create customer
 */
const createCustomer = async (customerData) => {
    try {
        const customer = {
            CID: customerData.CID || generateCustomerId(),
            CFN: customerData.CFN || "New",
            CMN: customerData.CMN || "",
            CLN: customerData.CLN || "Customer",
            CDN: customerData.CDN,
            CANN: customerData.CANN || "",
            CTL: 1,
            email: customerData.email || "",
            dob: customerData.dob || "",
            addressLine1: customerData.addressLine1 || "",
            addressLine2: customerData.addressLine2 || "",
            city: customerData.city || "",
            state: customerData.state || "",
            postalCode: customerData.postalCode || ""
        };

        const query = `
            INSERT INTO Customers (
                CID, CFN, CMN, CLN, CDN, CTL,
                CSTAT, CADL1, CADL2, CADLM,
                CADCT, CADST, CADC, CADZ,
                CDOB, CANN, CSPOU, CCHIL1, CCHIL2, CSPIN
            )
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, '', ?, ?, '', ?, ?, ?, '', '', '', ?)
        `;

        const params = [
            customer.CID,
            customer.CFN,
            customer.CMN,
            customer.CLN,
            customer.CDN,
            customer.CTL,
            customer.addressLine1,
            customer.addressLine2,
            customer.city,
            customer.state,
            customer.postalCode,
            customer.dob,
            customer.CANN,
            customer.email
        ];

        await pool.execute(query, params);

        return customer;
    } catch (error) {
        console.error("createCustomer error:", error);
        throw error;
    }
};

/**
 * Update verification
 */
const updateCustomerVerification = async (phone) => {
    try {
        const phones = [phone];

        if (phone.startsWith("+91")) {
            phones.push(phone.substring(3));
        } else {
            phones.push(`+91${phone}`);
        }

        const query = `
            UPDATE Customers
            SET CTL = 1
            WHERE CDN IN (?, ?)
        `;

        await pool.execute(query, phones);
        return true;
    } catch (error) {
        console.error("updateCustomerVerification error:", error);
        return false;
    }
};

module.exports = {
    findCustomerByPhone,
    createCustomer,
    updateCustomerVerification,
    generateCustomerId
};