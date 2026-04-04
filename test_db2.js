const mysql = require('mysql2/promise');

async function checkDb() {
    const pool = mysql.createPool({
        host: '68.178.235.232',
        user: 'peddaldba',
        password: '@Peddaldba#2026',
        database: 'PeddalDrop_Live',
        port: 3306
    });

    try {
        const [cols] = await pool.query("SHOW COLUMNS FROM Orders LIKE 'OWt'");
        console.table(cols);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
checkDb();
