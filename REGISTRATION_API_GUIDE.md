# 📝 Customer Registration API - Complete Guide

## ✅ **NEW API Created!**

A dedicated customer registration endpoint that allows users to register with complete profile information.

---

## 🔌 **API Endpoint**

### **POST** `/api/auth/register`

Register a new customer with their profile details.

---

## 📋 **Request Body**

```json
{
  "firstName": "John",
  "middleName": "M",        // Optional
  "lastName": "Doe",         // Optional
  "phone": "+919876543211",
  "email": "john@example.com",  // Optional
  "dob": "1990-01-15"       // Optional (YYYY-MM-DD format)
}
```

### **Required Fields:**
- ✅ `firstName` - Customer's first name
- ✅ `phone` - Phone number with country code (e.g., +91XXXXXXXXXX)

### **Optional Fields:**
- `middleName` - Middle name
- `lastName` - Last name
- `email` - Email address
- `dob` - Date of birth (YYYY-MM-DD)

---

## 📊 **Success Response (201)**

```json
{
  "success": true,
  "message": "Customer registered successfully",
  "customer": {
    "id": "C21158EUML",
    "firstName": "John",
    "middleName": "M",
    "lastName": "Doe",
    "phone": "+919876543211",
    "email": "john@example.com",
    "isVerified": false
  }
}
```

---

## ⚠️ **Error Responses**

### **400 - Bad Request (Missing Required Fields)**
```json
{
  "success": false,
  "error": "First name and phone number are required"
}
```

### **409 - Conflict (Duplicate Phone Number)**
```json
{
  "success": false,
  "error": "Customer with this phone number already exists",
  "customer": {
    "id": "C12345ABCDE",
    "firstName": "John",
    "phone": "+919876543211"
  }
}
```

### **500 - Internal Server Error**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 🧪 **Testing with cURL**

```bash
curl -X POST http://192.168.0.103:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "middleName": "M",
    "lastName": "Doe",
    "phone": "+919876543211",
    "email": "john@example.com",
    "dob": "1990-01-15"
  }'
```

---

## 💻 **Frontend Integration (TypeScript)**

```typescript
import { authService } from '@/services/authService';

// Register a new customer
const handleRegister = async () => {
  try {
    const response = await authService.registerCustomer({
      firstName: 'John',
      middleName: 'M',
      lastName: 'Doe',
      phone: '+919876543211',
      email: 'john@example.com',
      dob: '1990-01-15'
    });
    
    if (response.success) {
      console.log('Registration successful!');
      console.log('Customer ID:', response.customer.id);
      
      // Navigate to next screen or save token
    }
  } catch (error: any) {
    if (error.error?.includes('already exists')) {
      Alert.alert('Error', 'This phone number is already registered');
    } else {
      Alert.alert('Error', error.error || 'Registration failed');
    }
  }
};
```

---

## 🎯 **Use Cases**

### **1. Simple Registration (Minimum Info)**
```json
{
  "firstName": "Sarah",
  "phone": "+919123456789"
}
```

### **2. Complete Profile Registration**
```json
{
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "phone": "+919876543211",
  "email": "john.doe@email.com",
  "dob": "1990-05-15"
}
```

### **3. With Last Name Only**
```json
{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "phone": "+919988776655"
}
```

---

## 🔄 **Comparison: Registration vs OTP Flow**

| Feature | Registration API | OTP Flow |
|---------|-----------------|----------|
| **Endpoint** | `/api/auth/register` | `/api/auth/register-send-otp` |
| **Purpose** | Create complete profile | Quick login with OTP |
| **Fields** | firstName, lastName, email, dob, etc. | firstName, lastName, phone only |
| **Verification** | Not verified (isVerified: false) | Verified after OTP (isVerified: true) |
| **Response** | Customer details | OTP + Customer details |
| **Next Step** | Send OTP separately | Verify OTP → Login |

---

## 📱 **Recommended User Flow**

### **Option A: Registration First**
1. User fills registration form → Call `/api/auth/register`
2. Success → Show "Please verify your phone"
3. Send OTP → Call `/api/auth/register-send-otp`
4. Enter OTP → Call `/api/auth/verify-login`
5. Verified account → Main app

### **Option B: OTP First (Current Flow)**
1. User enters phone → Call `/api/auth/register-send-otp`
2. Enter OTP → Call `/api/auth/verify-login`
3. If not registered → Auto-register with basic info
4. Later prompt for complete profile

---

## 🔐 **Security Features**

✅ **Duplicate Prevention** - Checks existing phone numbers  
✅ **Input Validation** - Validates required fields  
✅ **Unique CID Generation** - 10-character unique IDs  
✅ **Data Sanitization** - Empty strings for optional fields  
✅ **Error Handling** - Detailed logging without exposing sensitive data  

---

## 📊 **Database Fields Mapped**

| API Field | Database Column | Type | Required |
|-----------|----------------|------|----------|
| firstName | CFN | varchar(25) | ✅ Yes |
| middleName | CMN | varchar(25) | No |
| lastName | CLN | varchar(25) | No |
| phone | CDN | varchar(50) | ✅ Yes |
| email | CSPIN | varchar(150) | No |
| dob | CDOB | date | No |

**Auto-generated:**
- `CID` - Customer ID (10 chars)
- `CTL` - Verification status (0 = Not verified, 1 = Verified)
- `CSTAT` - Status (1 = Active)

---

## 🧪 **Test Results**

```
✅ Registration API: WORKING
✅ Duplicate Detection: WORKING
✅ Customer Creation: WORKING
✅ CID Generation: WORKING (10 chars)
✅ Database Insert: WORKING
✅ Response Format: CORRECT
```

---

## 🚀 **Quick Test**

Run the test script:
```bash
cd "d:\PADDEL DROP\Paddel_Drop_Backend"
node test_registration_api.js
```

Expected output:
```
✅✅✅ REGISTRATION API WORKING PERFECTLY! ✅✅✅
Customer ID: C21158EUML
Name: John Doe
Phone: +919876543211
Verified: No

✅ Correctly rejected duplicate
```

---

## 📁 **Files Modified**

### **Backend:**
- ✅ `src/modules/auth/auth.controller.js` - Added `registerCustomer` function
- ✅ `src/modules/auth/auth.routes.js` - Added `/register` route
- ✅ `src/repositories/customer.repository.js` - Updated to handle email & dob

### **Frontend:**
- ✅ `services/authService.ts` - Added `registerCustomer()` method
- ✅ `utils/AllApiEndPoints.tsx` - Added `register` endpoint

---

## 🎉 **Ready to Use!**

Your registration API is fully functional and tested! You can now:

1. **Register customers** with complete profiles
2. **Detect duplicates** automatically
3. **Store additional info** like email and DOB
4. **Integrate with frontend** using TypeScript types

---

**Need a registration screen in your app?** Let me know and I'll create it! 🚀
