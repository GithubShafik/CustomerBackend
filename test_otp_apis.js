// Test script for OTP APIs
const axios = require('axios');

const API_URL = 'http://192.168.0.103:5000';

async function testAPIs() {
    console.log('🧪 Testing OTP Authentication APIs\n');
    console.log('=' .repeat(60));
    
    const testPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    console.log(`\n📱 Test Phone: ${testPhone}\n`);
    
    try {
        // Test 1: Register & Send OTP
        console.log('📤 Test 1: Register & Send OTP');
        console.log('-'.repeat(60));
        
        const registerResponse = await axios.post(`${API_URL}/api/auth/register-send-otp`, {
            firstName: 'Test',
            lastName: 'User',
            phone: testPhone
        });
        
        console.log('✅ Response:', JSON.stringify(registerResponse.data, null, 2));
        
        if (registerResponse.data.success && registerResponse.data.dev_otp) {
            console.log(`✅ OTP Generated: ${registerResponse.data.dev_otp}`);
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test 2: Verify OTP & Login
            console.log('\n📥 Test 2: Verify OTP & Login');
            console.log('-'.repeat(60));
            
            const verifyResponse = await axios.post(`${API_URL}/api/auth/verify-login`, {
                phone: testPhone,
                otp: registerResponse.data.dev_otp
            });
            
            console.log('✅ Response:', JSON.stringify(verifyResponse.data, null, 2));
            
            if (verifyResponse.data.success) {
                console.log('\n✅✅✅ BOTH APIs WORKING PERFECTLY! ✅✅✅\n');
                console.log(`Token: ${verifyResponse.data.token.substring(0, 50)}...`);
                console.log(`Customer: ${verifyResponse.data.customer.firstName} ${verifyResponse.data.customer.lastName}`);
                console.log(`Phone: ${verifyResponse.data.customer.phone}`);
            } else {
                console.log('\n❌ Verification failed\n');
            }
            
        } else {
            console.log('\n❌ Registration failed\n');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.response?.data || error.message);
        console.error('\nStack:', error.stack);
    }
    
    console.log('\n' + '='.repeat(60));
}

testAPIs();
