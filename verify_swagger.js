const swaggerDocs = require('./src/config/swagger');

console.log('--- Generated Swagger Paths ---');
const paths = Object.keys(swaggerDocs.paths);
paths.forEach(path => console.log(path));

const hasOrders = paths.some(p => p.includes('/orders'));
const hasLocation = paths.some(p => p.includes('/location'));

console.log('\n--- Verification Results ---');
console.log('Has /api/orders:', hasOrders);
console.log('Has /api/location:', hasLocation);

if (hasOrders && hasLocation) {
    console.log('\nSUCCESS: Found missing APIs in Swagger documentation.');
} else {
    console.log('\nFAILURE: Missing APIs not found in Swagger documentation.');
    process.exit(1);
}
