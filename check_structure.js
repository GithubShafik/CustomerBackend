const mysql = require('mysql2/promise');
const config = require('./src/config/env');

async function main() {
    try {
        const conn = await mysql.createConnection({
            host: config.db.host,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
            port: config.db.port
        });
        const [rows] = await conn.query('DESCRIBE DeliveryPartner');
        console.log(JSON.stringify(rows, null, 2));
        const [orderRows] = await conn.query('DESCRIBE Orders');
        console.log('Orders table:');
        console.log(JSON.stringify(orderRows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
