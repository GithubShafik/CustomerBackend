// Check table structure
const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkTable() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0
        });

        // Get table structure
        const [columns] = await pool.execute(
            "SHOW COLUMNS FROM Customers"
        );

        console.log('\n📊 Customers Table Structure:\n');
        console.log('Field\t\t| Type\t\t| Null\t| Key\t| Default');
        console.log('-'.repeat(80));
        
        columns.forEach(col => {
            console.log(`${col.Field}\t| ${col.Type}\t| ${col.Null}\t| ${col.Key}\t| ${col.Default || 'NULL'}`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTable();
