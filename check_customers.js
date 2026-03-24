// Check recent customers in database
const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkCustomers() {
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

        // Get last 5 customers
        const [customers] = await pool.execute(
            "SELECT CID, CFN, CLN, CDN, CTL FROM Customers ORDER BY CID DESC LIMIT 5"
        );

        console.log('\n📊 Recent Customers in Database:\n');
        console.log('CID\t\t\t| First Name\t| Last Name\t| Phone');
        console.log('-'.repeat(80));
        
        customers.forEach(cust => {
            console.log(`${cust.CID}\t| ${cust.CFN || 'NULL'}\t\t| ${cust.CLN || 'NULL'}\t\t| ${cust.CDN}`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkCustomers();
