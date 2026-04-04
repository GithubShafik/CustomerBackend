const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        connectTimeout: 30000
    });

    console.log("Connected to DB");

    // Step 1: Drop the foreign key constraint
    await conn.execute("ALTER TABLE Orders DROP FOREIGN KEY FK_OrderAttachment");
    console.log("✅ Dropped FK_OrderAttachment constraint");

    // Step 2: Change AttID to VARCHAR(36) in Attachments
    await conn.execute("ALTER TABLE Attachments MODIFY COLUMN AttID VARCHAR(36) NOT NULL");
    console.log("✅ Attachments.AttID changed to VARCHAR(36)");

    // Step 3: Find and change the matching column in Orders table
    const [orderCols] = await conn.execute("SHOW COLUMNS FROM Orders LIKE 'AttID'");
    if (orderCols.length > 0) {
        await conn.execute("ALTER TABLE Orders MODIFY COLUMN AttID VARCHAR(36)");
        console.log("✅ Orders.AttID changed to VARCHAR(36)");
    }

    // Step 4: Re-add the foreign key constraint
    await conn.execute("ALTER TABLE Orders ADD CONSTRAINT FK_OrderAttachment FOREIGN KEY (AttID) REFERENCES Attachments(AttID)");
    console.log("✅ FK_OrderAttachment re-added");

    // Verify
    const [rows] = await conn.execute("DESCRIBE Attachments");
    console.table(rows);

    await conn.end();
    console.log("Done!");
}

migrate().catch(err => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
