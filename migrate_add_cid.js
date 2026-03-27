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
        // 1. Check if CID column exists in Orders table
        const [columns] = await connection.query("SHOW COLUMNS FROM Orders LIKE 'CID'");

        if (columns.length === 0) {
            console.log("Adding CID column to Orders table...");
            await connection.query("ALTER TABLE Orders ADD COLUMN CID CHAR(36) NULL");
            console.log("✅ CID column added successfully.");
        } else {
            console.log("✅ CID column already exists. Ensuring it's CHAR(36)...");
            await connection.query("ALTER TABLE Orders MODIFY COLUMN CID CHAR(36) NULL");
            console.log("✅ CID column type verified.");
        }

        // 2. Backfill: copy ORCD into CID for any existing rows where CID is null
        const [result] = await connection.query(
            "UPDATE Orders SET CID = ORCD WHERE CID IS NULL AND ORCD IS NOT NULL"
        );
        console.log(`✅ Backfilled CID for ${result.affectedRows} existing orders.`);

        // 3. Also make sure ORCD is CHAR(36) 
        await connection.query("ALTER TABLE Orders MODIFY COLUMN ORCD CHAR(36) NULL");
        console.log("✅ ORCD column type verified as CHAR(36).");

    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    } finally {
        await connection.end();
    }
}

migrate();
