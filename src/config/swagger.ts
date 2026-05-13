import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Educational CMS API',
      version: '1.0.0',
      description: 'API for managing short informative videos',
    },
    servers: [{ url: 'http://localhost:8080' }],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);