// Manual INSERT test
const mysql = require("mysql2/promise");
require("dotenv").config();

async function testInsert() {
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

        const generateCustomerId = () => {
            const timestamp = Date.now().toString().slice(-5);
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `C${timestamp}${random}`;
        };
        
        const testCID = generateCustomerId();
        console.log(`\n📝 Testing INSERT with CID: ${testCID}\n`);

        const query = `
            INSERT INTO Customers (CID, CFN, CMN, CLN, CDN, CTL, CSTAT, CADL1, CADL2, CADLM, CADCT, CADST, CADC, CADZ, CDOB, CANN, CSPOU, CCHIL1, CCHIL2, CSPIN)
            VALUES (?, ?, ?, ?, ?, ?, 1, '', '', '', '', '', '', '', '', '', '', '', '', '')
        `;
        
        const result = await pool.execute(query, [testCID, 'Test', '', 'User', '+919999999999', 0]);
        console.log('✅ INSERT SUCCESSFUL!');
        console.log('Result:', result);

        // Verify it was created
        const [rows] = await pool.execute('SELECT CID, CFN, CLN, CDN FROM Customers WHERE CID = ?', [testCID]);
        console.log('\n📊 Created Customer:', rows[0]);

        await pool.end();
    } catch (error) {
        console.error('❌ INSERT FAILED:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('SQL Message:', error.sqlMessage);
        console.error('Errno:', error.errno);
    }
}

testInsert();
