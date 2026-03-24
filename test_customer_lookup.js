// Test script to check customer data in database
const mysql = require("mysql2/promise");
require("dotenv").config();

async function testDatabase() {
    console.log("🔍 Testing database connection...\n");
    
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0
        });

        // Get all customers
        const [customers] = await pool.execute("SELECT CID, CFN, CLN, CDN, CTL FROM Customers ORDER BY CID DESC LIMIT 10");
        
        console.log("📊 Last 10 Customers in Database:\n");
        console.log("CID\t\t| First Name\t| Last Name\t| Phone");
        console.log("-".repeat(70));
        
        customers.forEach(cust => {
            console.log(`${cust.CID}\t| ${cust.CFN || 'NULL'}\t\t| ${cust.CLN || 'NULL'}\t\t| ${cust.CDN}`);
        });
        
        // Check specific phone numbers
        const testPhones = ['+911122211222', '+918530272912', '1122211222', '8530272912'];
        
        console.log("\n\n🔍 Searching for specific phones:\n");
        
        for (const phone of testPhones) {
            const [results] = await pool.execute("SELECT * FROM Customers WHERE CDN = ?", [phone]);
            console.log(`Phone: ${phone} - Found: ${results.length > 0 ? 'YES' : 'NO'}`);
            if (results.length > 0) {
                console.log(`  Customer ID: ${results[0].CID}, Name: ${results[0].CFN} ${results[0].CLN}`);
            }
        }
        
        await pool.end();
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

testDatabase();
