const mysql = require("mysql2/promise");
const config = require("./src/config/env");

const dbConfig = {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    port: config.db.port,
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const table = "Customers";
        const column = "CID";
        const type = "CHAR(36)";

        console.log(`Altering ${table}.${column} to ${type}...`);
        await connection.execute(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${type}`);
        console.log(`✅ Success: ${table}.${column} updated.`);

    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
