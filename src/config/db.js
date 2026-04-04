const mysql = require("mysql2/promise");
const config = require("./env");

const dbConfig = {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    port: config.db.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000 // 10 seconds
};

const connection = mysql.createPool(dbConfig);

const connectDB = async () => {
    try {
        console.log("Connecting to Paddel Drop DB...");
        await connection.query("SELECT 1");
        console.log("Paddel Drop DB Connected");
    } catch (err) {
        console.error("Paddel Drop DB Connection Failed");
        console.error("Error Details:", err.message);
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
            console.error("Tip: Check if the database host is reachable and port 3306 is open on your network.");
        }
    }
};

module.exports = { connectDB, connection };
