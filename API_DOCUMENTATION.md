# 🚀 Paddel Drop Backend - API Documentation

## Overview
Clean and simple OTP-based authentication for customers using only the **Customers** table.

---

## 🔐 Authentication Flow

### Step 1: Register & Send OTP
Customer provides first name, last name, and phone number to receive an OTP.

**Endpoint:** `POST /api/auth/register-send-otp`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your phone",
  "dev_otp": "337763"
}
```

**What Happens:**
1. ✅ Generates 6-digit OTP
2. ✅ Stores OTP in server memory (10-minute validity)
3. ✅ Creates new customer if doesn't exist
4. ✅ Returns OTP in `dev_otp` field (for testing)

---

### Step 2: Verify OTP & Login
Customer enters the received OTP to complete login.

**Endpoint:** `POST /api/auth/verify-login`

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "337763"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "customerId": "CUST-17732",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+919876543210",
    "isVerified": true
  }
}
```

**What Happens:**
1. ✅ Verifies OTP from memory
2. ✅ Checks OTP expiry (10 minutes)
3. ✅ Generates JWT token (7-day validity)
4. ✅ Returns customer details and auth token

---

## 📊 Database Schema

### Customers Table (Only Table Used)

| Column | Type | Description |
|--------|------|-------------|
| CID | char(10) | Customer ID (Primary Key) |
| CFN | varchar(25) | Customer First Name |
| CMN | varchar(25) | Customer Middle Name |
| CLN | varchar(25) | Customer Last Name |
| CDN | varchar(50) | Customer Phone Number |
| CTL | tinyint(4) | Verification Status (0=No, 1=Yes) |
| CSTAT | tinyint(4) | Customer Status |

**Note:** No additional tables required!

---

## 🧪 Testing

### Automated Test
```bash
node test_auth_flow.js
```

This script tests the complete flow:
1. Registers a customer
2. Receives OTP
3. Verifies OTP and logs in
4. Displays JWT token

### Manual Testing with cURL

**Register & Send OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/register-send-otp \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","phone":"+919876543210"}'
```

**Verify & Login:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"337763"}'
```

### Testing with PowerShell

```powershell
# Step 1: Register and get OTP
$register = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register-send-otp" `
  -Method POST -ContentType "application/json" `
  -Body '{"firstName":"John","lastName":"Doe","phone":"+919876543210"}'

Write-Host "OTP:" $register.dev_otp

# Step 2: Wait a moment, then verify and login
Start-Sleep -Seconds 2

$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-login" `
  -Method POST -ContentType "application/json" `
  -Body @{ phone = "+919876543210"; otp = $register.dev_otp } | ConvertTo-Json

Write-Host "Token:" $login.token
```

---

## 📱 Mobile App Integration

Update your React Native app's API configuration:

```javascript
// paddle-drop/src/services/api.js
const api = axios.create({
  baseURL: "http://192.168.0.103:5000", // Your computer's IP
});

// Usage in your app
export const authService = {
  registerAndSendOtp: async (firstName, lastName, phone) => {
    const response = await api.post('/api/auth/register-send-otp', {
      firstName,
      lastName,
      phone
    });
    return response.data;
  },
  
  verifyAndLogin: async (phone, otp) => {
    const response = await api.post('/api/auth/verify-login', {
      phone,
      otp
    });
    return response.data;
  }
};
```

---

## ⚠️ Important Notes

### Development Mode
- ✅ `dev_otp` is returned in response for easy testing
- ✅ OTPs are logged to console
- ✅ Perfect for local development and testing

### Production Mode (Later)
- ⚠️ Remove `dev_otp` from responses
- ⚠️ Integrate SMS service (Twilio, MSG91, etc.)
- ⚠️ Add rate limiting for security
- ⚠️ Use HTTPS

### In-Memory Storage
- ⚠️ OTPs stored in server memory
- ⚠️ Reset on server restart
- ⚠️ Valid for 10 minutes
- ⚠️ For production: Add `user_otps` table

---

## 🔒 Security Features

✅ **OTP Expiry**: 10 minutes validity  
✅ **JWT Expiry**: 7 days  
✅ **Auto-delete**: OTPs removed after verification  
✅ **Validation**: Required fields checked  
✅ **Error Handling**: Comprehensive error messages  

---

## 📁 Project Structure

```
PADDLE_DROP_Backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.controller.js
│   │       ├── auth.routes.js
│   │       └── auth.service.js
│   ├── repositories/
│   │   └── customer.repository.js
│   ├── utils/
│   │   └── GenerateOTP.js
│   └── app.js
├── .env
├── server.js
├── test_auth_flow.js
└── README.md
```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js v24.12.0
- **Framework:** Express.js
- **Database:** MySQL/MariaDB
- **Authentication:** JWT (jsonwebtoken)
- **HTTP Client:** Axios (for testing)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` file:
```env
PORT=5000
DB_HOST=68.178.235.232
DB_USER=peddaldba
DB_PASSWORD=@Peddaldba#2026
DB_NAME=PeddalDrop_Live
DB_PORT=3306
JWT_SECRET=paddel-drop-jwt-secret-key-2026-change-in-production
```

### 3. Run Server
```bash
node server.js
```

### 4. Test API
```bash
node test_auth_flow.js
```

---

## 📞 Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (missing required fields) |
| 401 | Unauthorized (invalid/expired OTP) |
| 404 | Not Found (customer not found) |
| 500 | Internal Server Error |

---

## 🎯 Next Steps

### Immediate (Ready Now):
✅ Test with mobile app
✅ Update frontend UI for registration flow
✅ Test on physical device

### Future Enhancements:
- [ ] Add SMS integration for real OTP sending
- [ ] Add `user_otps` table for persistent storage
- [ ] Implement rate limiting
- [ ] Add refresh token functionality
- [ ] Add user profile endpoints
- [ ] Add logout endpoint

---

**Your clean OTP authentication system is ready!** 🎉

For support or questions, check the main README.md file.
