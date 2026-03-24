// Test script for Registration API
const axios = require('axios');

const API_URL = 'http://192.168.0.103:5000';

async function testRegistration() {
    console.log('🧪 Testing Customer Registration API\n');
    console.log('=' .repeat(60));
    
    const testData = {
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        phone: '+919876543211',
        email: 'john.doe@example.com',
        dob: '1990-01-15'
    };
    
    console.log('\n📝 Test Data:');
    console.log(`   Name: ${testData.firstName} ${testData.middleName} ${testData.lastName}`);
    console.log(`   Phone: ${testData.phone}`);
    console.log(`   Email: ${testData.email}`);
    console.log(`   DOB: ${testData.dob}`);
    
    try {
        // Test Registration
        console.log('\n📤 Testing POST /api/auth/register');
        console.log('-'.repeat(60));
        
        const response = await axios.post(`${API_URL}/api/auth/register`, testData);
        
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n✅✅✅ REGISTRATION API WORKING PERFECTLY! ✅✅✅\n');
            console.log(`Customer ID: ${response.data.customer.id}`);
            console.log(`Name: ${response.data.customer.firstName} ${response.data.customer.lastName}`);
            console.log(`Phone: ${response.data.customer.phone}`);
            console.log(`Verified: ${response.data.customer.isVerified ? 'Yes' : 'No'}`);
        } else {
            console.log('\n❌ Registration failed\n');
        }
        
        // Test duplicate registration
        console.log('\n\n🔄 Testing Duplicate Registration (should fail)');
        console.log('-'.repeat(60));
        
        try {
            const dupResponse = await axios.post(`${API_URL}/api/auth/register`, testData);
            console.log('❌ Should have failed but succeeded!');
        } catch (dupError) {
            console.log('✅ Correctly rejected duplicate:');
            console.log('   Status:', dupError.response?.status);
            console.log('   Error:', dupError.response?.data?.error);
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(60));
}

testRegistration();
