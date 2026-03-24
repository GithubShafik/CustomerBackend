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
 * Find a customer by phone number (with fallback for country code variations)
 */
const findCustomerByPhone = async (phone) => {
    try {
        let query = "SELECT * FROM Customers WHERE CDN = ?";
        let [results] = await pool.execute(query, [phone]);

        if (results[0]) {
            console.log(`✅ Found customer with exact match: ${phone}`);
            return results[0];
        }

        console.log(`❌ No exact match for: ${phone}, trying variations...`);

        if (phone.startsWith('+91') && phone.length > 3) {
            const phoneWithoutCode = phone.substring(3);
            console.log(`🔍 Trying without +91: ${phoneWithoutCode}`);
            [results] = await pool.execute(query, [phoneWithoutCode]);

            if (results[0]) {
                console.log(`✅ Found customer without +91: ${phoneWithoutCode}`);
                return results[0];
            }
        }

        if (!phone.startsWith('+91')) {
            const phoneWithCode = `+91${phone}`;
            console.log(`🔍 Trying with +91: ${phoneWithCode}`);
            [results] = await pool.execute(query, [phoneWithCode]);

            if (results[0]) {
                console.log(`✅ Found customer with +91: ${phoneWithCode}`);
                return results[0];
            }
        }

        console.log(`❌ Customer not found with any variation of: ${phone}`);
        return null;
    } catch (error) {
        console.error("Error finding customer by phone:", error);
        throw error;
    }
};

/**
 * Create a new customer
 */
const createCustomer = async (customerData) => {
    try {
        const {
            CID,
            CFN,
            CMN,
            CLN,
            CDN,
            CTL,
            email,
            dob,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode
        } = customerData;

        const query = `
            INSERT INTO Customers (
                CID, CFN, CMN, CLN, CDN, CTL,
                CSTAT, CADL1, CADL2, CADLM,
                CADCT, CADST, CADC, CADZ,
                CDOB, CANN, CSPOU, CCHIL1, CCHIL2, CSPIN
            )
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, '', ?, ?, '', ?, ?, '', '', '', '', ?)
        `;

        const params = [
            CID,
            CFN        || '',
            CMN        || '',
            CLN        || '',
            CDN,
            CTL        ?? 0,
            addressLine1 || '',
            addressLine2 || '',
            city         || '',
            state        || '',
            postalCode   || '',
            dob          || '',
            email        || ''
        ];

        console.log(`💾 Attempting to create customer: ${CID}, Phone: ${CDN}`);
        await pool.execute(query, params);
        console.log(`✅ Customer created successfully: ${CID}`);

        return { CID, CFN, CMN, CLN, CDN, CTL };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️ Duplicate CID ${customerData.CID}, generating new one...`);
            const newCID = generateCustomerId();
            console.log(`🆕 New CID: ${newCID}`);

            const {
                CFN, CMN, CLN, CDN, CTL,
                email, dob,
                addressLine1, addressLine2,
                city, state, postalCode
            } = customerData;

            const query = `
                INSERT INTO Customers (
                    CID, CFN, CMN, CLN, CDN, CTL,
                    CSTAT, CADL1, CADL2, CADLM,
                    CADCT, CADST, CADC, CADZ,
                    CDOB, CANN, CSPOU, CCHIL1, CCHIL2, CSPIN
                )
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, '', ?, ?, '', ?, ?, '', '', '', '', ?)
            `;

            const params = [
                newCID,
                CFN          || '',
                CMN          || '',
                CLN          || '',
                CDN,
                CTL          ?? 0,
                addressLine1 || '',
                addressLine2 || '',
                city         || '',
                state        || '',
                postalCode   || '',
                dob          || '',
                email        || ''
            ];

            console.log(`💾 Retrying with new CID: ${newCID}, Phone: ${CDN}`);
            await pool.execute(query, params);
            console.log(`✅ Customer created successfully with new CID: ${newCID}`);

            return { CID: newCID, CFN, CMN, CLN, CDN, CTL };
        }

        console.error("❌ Error creating customer:", error.message);
        throw error;
    }
};

/**
 * Update customer phone verification status
 */
const updateCustomerVerification = async (phone) => {
    try {
        const query = `
            UPDATE Customers 
            SET CTL = 1 
            WHERE CDN = ?
        `;
        await pool.execute(query, [phone]);
        return true;
    } catch (error) {
        console.error("Error updating customer verification:", error);
        throw error;
    }
};

/**
 * Generate a unique customer ID (max 10 chars to fit char(10) column)
 */
const generateCustomerId = () => {
    const timestamp = Date.now().toString().slice(-5);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `C${timestamp}${random}`;
};

module.exports = {
    findCustomerByPhone,
    createCustomer,
    updateCustomerVerification,
    generateCustomerId
};