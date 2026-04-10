const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLatestOrder() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT)
        });

        console.log('✅ Connected to database\n');

        // Check the latest order
        const orderId = 'cb02148d-fcae-4017-9f33-d290144afa70';
        
        console.log(`🔍 Checking order: ${orderId}\n`);
        
        // Get OrderTrips data
        const [trips] = await connection.query(`
            SELECT OTID, ORID, OTDN, OTDO, OTSA1, OTDA1, OTSD
            FROM OrderTrips 
            WHERE ORID = ?
            ORDER BY OTSD DESC
            LIMIT 5
        `, [orderId]);

        console.log('📋 OrderTrips data:');
        console.table(trips);

        // Get Orders data
        const [orders] = await connection.query(`
            SELECT ORID, ORCD, ORVL, ORST, ORDT
            FROM Orders 
            WHERE ORID = ?
        `, [orderId]);

        console.log('\n📦 Orders data:');
        console.table(orders);

        // Check all recent orders with destination contacts
        console.log('\n📊 Last 5 orders with destination contacts:');
        const [recentOrders] = await connection.query(`
            SELECT 
                o.ORID,
                o.ORCD,
                o.ORVL,
                o.ORST,
                t.OTDN,
                t.OTDO,
                t.OTSA1 as pickup,
                t.OTDA1 as destination,
                o.ORDT
            FROM Orders o
            LEFT JOIN OrderTrips t ON o.ORID = t.ORID
            ORDER BY o.ORDT DESC
            LIMIT 5
        `);

        console.table(recentOrders);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed');
        }
    }
}

checkLatestOrder();
