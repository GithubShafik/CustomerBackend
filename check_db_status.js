const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkTable() {
    console.log("Starting DB check...");
    console.log("DB Host:", process.env.DB_HOST);
    
    let pool;
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 1,
            connectTimeout: 5000 // 5 seconds
        });

        const [tables] = await pool.execute("SHOW TABLES");
        console.log("Tables found:", tables.map(t => Object.values(t)[0]));

        const tablesToCheck = ['Orders', 'OrderTrips', 'DPLocation'];
        for (const table of tablesToCheck) {
            try {
                const [cols] = await pool.execute(`DESCRIBE ${table}`);
                console.log(`\n✅ Table ${table} exists. Columns:`, cols.map(c => c.Field).join(", "));
            } catch (e) {
                console.log(`\n❌ Table ${table} NOT found or error:`, e.message);
            }
        }
    } catch (error) {
        console.error('❌ DB Error:', error.message);
    } finally {
        if (pool) await pool.end();
        console.log("Done.");
    }
}

checkTable();
