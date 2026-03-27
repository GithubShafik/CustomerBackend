const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    });

    try {
        console.log("Dropping foreign keys to allow column changes...");
        // Use try-catch for each drop in case they don't exist
        const dropFks = [
            "ALTER TABLE OrdTripLeg DROP FOREIGN KEY FK_OrdTripLeg_DeliveryPartner",
            "ALTER TABLE OrdTripLeg DROP FOREIGN KEY FK_OrdTripLeg_Orders",
            "ALTER TABLE OrdTripLeg DROP FOREIGN KEY FK_OrdTripLeg_OrderTrips",
            "ALTER TABLE OrderTrips DROP FOREIGN KEY FK_OrderTrips_Orders",
            "ALTER TABLE DeliveryPartnerDetails DROP FOREIGN KEY FK_DP_Registration",
            "ALTER TABLE DPLocation DROP FOREIGN KEY FK_DPLocation_DeliveryPartner"
        ];

        for (const sql of dropFks) {
            try { await connection.query(sql); } catch (e) { console.log(`Skipping: ${sql} (might not exist)`); }
        }

        console.log("Checking for DPID column in Orders table...");
        const [columns] = await connection.query("SHOW COLUMNS FROM Orders LIKE 'DPID'");
        
        if (columns.length === 0) {
            console.log("Adding DPID column...");
            await connection.query("ALTER TABLE Orders ADD COLUMN DPID VARCHAR(36) NULL");
            console.log("✅ DPID column added successfully.");
        } else {
            console.log("✅ DPID column already exists.");
        }

        console.log("Checking ORID column type in Orders...");
        await connection.query("ALTER TABLE Orders MODIFY COLUMN ORID CHAR(36) NOT NULL");
        console.log("✅ ORID column modified to CHAR(36).");

        console.log("Checking ORST column type...");
        await connection.query("ALTER TABLE Orders MODIFY COLUMN ORST VARCHAR(50) NULL");
        console.log("✅ ORST column modified to VARCHAR(50).");

        console.log("Checking OrderTrips IDs...");
        await connection.query("ALTER TABLE OrderTrips MODIFY COLUMN OTID CHAR(36) NOT NULL");
        await connection.query("ALTER TABLE OrderTrips MODIFY COLUMN ORID CHAR(36) NULL");
        console.log("✅ OrderTrips IDs modified to CHAR(36).");

        console.log("Checking OrdTripLeg IDs...");
        await connection.query("ALTER TABLE OrdTripLeg MODIFY COLUMN OTLID CHAR(36) NOT NULL");
        await connection.query("ALTER TABLE OrdTripLeg MODIFY COLUMN OTID CHAR(36) NULL");
        await connection.query("ALTER TABLE OrdTripLeg MODIFY COLUMN ORID CHAR(36) NULL");
        await connection.query("ALTER TABLE OrdTripLeg MODIFY COLUMN DPID CHAR(36) NULL");
        console.log("✅ OrdTripLeg IDs modified to CHAR(36).");

        console.log("Checking DeliveryPartner IDs...");
        await connection.query("ALTER TABLE DeliveryPartner MODIFY COLUMN DPID CHAR(36) NOT NULL");
        console.log("✅ DeliveryPartner ID modified to CHAR(36).");

        console.log("Checking DPLocation IDs...");
        await connection.query("ALTER TABLE DPLocation MODIFY COLUMN DPID CHAR(36) NOT NULL");
        await connection.query("ALTER TABLE DPLocation MODIFY COLUMN DPOID CHAR(36) NULL");
        await connection.query("ALTER TABLE DPLocation MODIFY COLUMN DPTID CHAR(36) NULL");
        console.log("✅ DPLocation IDs modified to CHAR(36).");

        console.log("Enabling foreign key checks...");
        await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    } finally {
        await connection.end();
    }
}

migrate();
