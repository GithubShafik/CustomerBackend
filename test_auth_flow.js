const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testRegistrationAndLogin() {
    console.log('=== Testing Registration + OTP Login Flow ===\n');
    
    const testData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+919876543210'
    };
    
    try {
        // Step 1: Register and Send OTP
        console.log('📝 Step 1: Registering customer...');
        console.log('Request:', JSON.stringify(testData, null, 2));
        
        const registerResponse = await axios.post(`${BASE_URL}/register-send-otp`, testData);
        
        console.log('\n✅ Registration Successful!');
        console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
        
        if (!registerResponse.data.dev_otp) {
            console.log('\n❌ No OTP in response. Check server logs.');
            return;
        }
        
        const otp = registerResponse.data.dev_otp;
        console.log(`\n📱 Your OTP is: ${otp}\n`);
        
        // Wait 2 seconds to simulate user entering OTP
        console.log('⏳ Waiting 2 seconds (simulating user entering OTP)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 2: Verify OTP and Login
        console.log('\n🔐 Step 2: Verifying OTP and logging in...');
        const loginData = {
            phone: testData.phone,
            otp: otp
        };
        console.log('Request:', JSON.stringify(loginData, null, 2));
        
        const loginResponse = await axios.post(`${BASE_URL}/verify-login`, loginData);
        
        console.log('\n✅ Login Successful!');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        
        if (loginResponse.data.token) {
            console.log('\n🎉 SUCCESS! Full authentication flow completed!');
            console.log('\n📋 Customer Details:');
            console.log(JSON.stringify(loginResponse.data.customer, null, 2));
            console.log('\n🔑 JWT Token (first 50 chars):', loginResponse.data.token.substring(0, 50) + '...');
        }
        
    } catch (error) {
        console.error('\n❌ Test Failed!');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
        
        if (error.code) {
            console.error('Code:', error.code);
        }
    }
}

// Run the test
testRegistrationAndLogin();
