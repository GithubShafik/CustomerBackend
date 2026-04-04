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
        const [rows] = await pool.query('SELECT ORID, AttID, OWt, ORDT FROM Orders ORDER BY ORDT DESC LIMIT 5;');
        console.log("=== RECENT ORDERS ===");
        console.table(rows);
        
        const [cols] = await pool.query("SHOW COLUMNS FROM Orders LIKE 'AttID'");
        console.log("=== ATTID COLUMN DEFN ===");
        console.table(cols);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
checkDb();
