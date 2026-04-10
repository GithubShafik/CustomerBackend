const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndAddColumns() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT)
        });

        console.log('✅ Connected to database');

        // Check if columns exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'OrderTrips' 
            AND COLUMN_NAME IN ('OTDN', 'OTDO')
        `, [process.env.DB_NAME]);

        console.log('\n📊 Current columns in OrderTrips:');
        console.log(columns);

        if (columns.length === 0) {
            console.log('\n❌ OTDN and OTDO columns do not exist. Adding them...');
            
            // Add OTDN column
            await connection.query(`
                ALTER TABLE OrderTrips 
                ADD COLUMN OTDN VARCHAR(100) NULL 
                COMMENT 'Order trip destination contact name'
            `);
            console.log('✅ Added OTDN column');

            // Add OTDO column
            await connection.query(`
                ALTER TABLE OrderTrips 
                ADD COLUMN OTDO VARCHAR(20) NULL 
                COMMENT 'Order trip destination contact phone'
            `);
            console.log('✅ Added OTDO column');

        } else if (columns.length === 2) {
            console.log('\n✅ Both OTDN and OTDO columns already exist');
            
            // Check if they allow NULL
            const otdnAllowsNull = columns.find(c => c.COLUMN_NAME === 'OTDN')?.IS_NULLABLE === 'YES';
            const otdoAllowsNull = columns.find(c => c.COLUMN_NAME === 'OTDO')?.IS_NULLABLE === 'YES';
            
            if (otdnAllowsNull || otdoAllowsNull) {
                console.log('⚠️  Columns allow NULL values. This is okay for now.');
            }
        } else {
            console.log('\n⚠️  Only some columns exist. Fixing...');
            
            if (!columns.find(c => c.COLUMN_NAME === 'OTDN')) {
                await connection.query(`
                    ALTER TABLE OrderTrips 
                    ADD COLUMN OTDN VARCHAR(100) NULL 
                    COMMENT 'Order trip destination contact name'
                `);
                console.log('✅ Added OTDN column');
            }
            
            if (!columns.find(c => c.COLUMN_NAME === 'OTDO')) {
                await connection.query(`
                    ALTER TABLE OrderTrips 
                    ADD COLUMN OTDO VARCHAR(20) NULL 
                    COMMENT 'Order trip destination contact phone'
                `);
                console.log('✅ Added OTDO column');
            }
        }

        // Verify final state
        const [finalCheck] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'OrderTrips' 
            AND COLUMN_NAME IN ('OTDN', 'OTDO')
        `, [process.env.DB_NAME]);

        console.log('\n✅ Final column state:');
        console.table(finalCheck);

        // Test with a sample query
        console.log('\n🧪 Testing INSERT with OTDN and OTDO...');
        const testTripId = 'test-' + Date.now();
        const testOrderId = 'test-order-' + Date.now();
        
        try {
            await connection.query(`
                INSERT INTO OrderTrips (
                    OTID, ORID, OTSLL, OTDLL, 
                    OTSA1, OTSC, OTSS, OTSCO,
                    OTDA1, OTDC, OTDS, OTDCO,
                    OTSD, OTDD, OTDN, OTDO
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
            `, [
                testTripId,
                testOrderId,
                '19.0760,72.8777',
                '19.0896,72.8656',
                'Test Pickup',
                'Mumbai',
                'Maharashtra',
                'India',
                'Test Destination',
                'Mumbai',
                'Maharashtra',
                'India',
                'Test Receiver',
                '9876543210'
            ]);
            
            console.log('✅ Test INSERT successful');

            // Verify the data was inserted
            const [testResult] = await connection.query(`
                SELECT OTID, ORID, OTDN, OTDO FROM OrderTrips WHERE OTID = ?
            `, [testTripId]);
            
            console.log('\n📋 Test SELECT result:');
            console.table(testResult);

            // Clean up test data
            await connection.query('DELETE FROM OrderTrips WHERE OTID = ?', [testTripId]);
            await connection.query('DELETE FROM Orders WHERE ORID = ?', [testOrderId]);
            console.log('\n🧹 Cleaned up test data');

        } catch (error) {
            console.error('❌ Test INSERT failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed');
        }
    }
}

checkAndAddColumns();
