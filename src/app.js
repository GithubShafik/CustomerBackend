const express = require('express');
const cors = require('cors');
const router = require('./routes/index');
const errorMiddleware = require('./middlewares/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');
const { connectDB } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Connect DB (important)
connectDB();

// Swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api', router);

// Error handler
app.use(errorMiddleware);

module.exports = app;