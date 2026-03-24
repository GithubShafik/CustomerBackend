                                                                                                                                                                                                                                            const express = require('express');
const cors = require('cors');
const router = require('./routes/index');
const errorMiddleware = require('./middlewares/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const swaggerDocs = require('./config/swagger');

const app = express();

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Main Routes
app.use('/api', router);

// Error Handler
app.use(errorMiddleware);

module.exports = app;
