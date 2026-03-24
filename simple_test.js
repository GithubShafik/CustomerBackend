// Simple direct API test with logging
const axios = require('axios');

const API_URL = 'http://192.168.0.103:5000';

async function simpleTest() {
    const testPhone = '+919999888877';
    
    console.log('📤 Step 1: Register & Send OTP');
    try {
        const regResp = await axios.post(`${API_URL}/api/auth/register-send-otp`, {
            firstName: 'Test',
            lastName: 'User',
            phone: testPhone
        });
        console.log('✅ Registration Response:', regResp.data);
        console.log('📱 OTP:', regResp.data.dev_otp);
        
        console.log('\n📥 Step 2: Verify OTP');
        const verifyResp = await axios.post(`${API_URL}/api/auth/verify-login`, {
            phone: testPhone,
            otp: regResp.data.dev_otp
        });
        console.log('✅ Verification Response:', verifyResp.data);
        console.log('✅ SUCCESS! Token:', verifyResp.data.token ? 'Received' : 'Missing');
        console.log('✅ Customer:', verifyResp.data.customer?.firstName);
        
    } catch (error) {
        console.error('❌ ERROR:', error.response?.data);
    }
}

simpleTest();
