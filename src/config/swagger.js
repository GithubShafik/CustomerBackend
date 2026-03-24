const swaggerJsDoc = require('swagger-jsdoc');
const config = require('./env');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Paddel Drop API Documentation',
            version: '1.0.0',
            description: 'API documentation for the Paddel Drop Backend application',
            contact: {
                name: 'Developer'
            },
            servers: [
                {
                    url: '/',
                    description: 'Current Environment'
                },
                {
                    url: `http://localhost:${config.port}`,
                    description: 'Local server'
                }
            ]
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: [
        './src/modules/**/*.routes.js',
        './src/routes/*.js',
        './src/app.js',
        './server.js'
    ] // Paths to files containing OpenAPI definitions
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
