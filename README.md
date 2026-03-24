# Paddel Drop Backend - Clean Architecture

## 📁 Project Structure

```
PADDLE_DROP_Backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── db.js           # Database connection
│   │   └── env.js          # Environment variables
│   │
│   ├── modules/            # Feature modules
│   │   ├── auth/          # Authentication module
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.service.js
│   │   │
│   │   └── location/      # Location module
│   │       ├── location.controller.js
│   │       ├── location.routes.js
│   │       └── location.service.js
│   │
│   ├── repositories/       # Data access layer
│   │   ├── customer.repository.js
│   │   └── otp.repository.js
│   │
│   ├── middlewares/        # Express middlewares
│   │   └── errorMiddleware.js
│   │
│   ├── routes/            # Main routes aggregator
│   │   └── index.js
│   │
│   ├── utils/             # Utility functions
│   │   └── GenerateOTP.js
│   │
│   └── app.js            # Express app setup
│
├── .env                  # Environment variables
├── .env.example          # Environment template
├── server.js            # Entry point
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` file with your database credentials:
```env
PORT=5000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306
JWT_SECRET=your-secret-key
```

### 3. Run Server
```bash
node server.js
```

## 📡 API Endpoints

### Authentication

#### 1. Register & Send OTP
```http
POST /api/auth/register-send-otp
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "dev_otp": "123456"
}
```

#### 2. Verify OTP & Login
```http
POST /api/auth/verify-login
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "customerId": "CUST-123456",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+919876543210",
    "isVerified": true
  }
}
```

## 🔧 Development

### Run in Development Mode
```bash
node --watch server.js
```

### Run Tests
```bash
npm test
```

## 📝 Notes

- **Development Mode**: OTP is returned in response for easy testing
- **Production Mode**: Remove `dev_otp` from responses and integrate SMS service
- **Database**: Uses MySQL/MariaDB with Customers table only
- **Authentication**: JWT-based with 7-day expiry

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL/MariaDB
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt (for future use)
