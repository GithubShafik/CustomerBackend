const axios = require('axios');

async function testFix() {
    const API_URL = 'http://localhost:5000';
    console.log('🧪 Testing Updated Registration Fix on localhost:5000\n');
    
    // These should all normalize to +919876543210
    const formats = [
        '9876543210',             // 10 digits
        '+919876543210',          // Correct format
        '919876543210',           // 12 digits starting with 91
        '+91 98765 43210',        // With spaces
        '9876-543-210'            // With dashes
    ];
    
    for (const phone of formats) {
        console.log(`\nTesting phone input: "${phone}"`);
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                firstName: 'Test',
                lastName: 'User',
                phone: phone,
                email: `test_${Math.random().toString(36).substring(7)}@example.com`
            });
            console.log(`✅ Success for "${phone}":`, response.data.message);
            console.log(`   Normalized Phone in response: ${response.data.customer.phone}`);
        } catch (error) {
            console.log(`❌ Failed for "${phone}":`, error.response?.data?.error || error.message);
        }
    }
}

testFix();
