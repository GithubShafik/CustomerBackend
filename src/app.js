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

// Swagger JSON endpoint
app.get('/swagger', (req, res) => {
    res.json(swaggerDocs);
});

// Swagger UI Manual Setup (Robust for Vercel)
app.get('/swagger', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Paddel Drop API Documentation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css">
    <link rel="icon" type="image/png" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/favicon-32x32.png" sizes="32x32" />
    <style>
        html { box-sizing: border-box; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .swagger-ui .topbar { display: none }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/api-docs',
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout",
            });
        };
    </script>
</body>
</html>
    `);
});

// Routes
app.use('/api', router);

// Error handler
app.use(errorMiddleware);

module.exports = app;