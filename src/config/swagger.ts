import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Educational CMS API',
      version: '1.0.0',
      description: 'API for managing educational video content with S3 streaming',
      contact: {
        name: 'CMS Backend Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'API health check',
      },
      {
        name: 'Authentication',
        description: 'User and superadmin authentication',
      },
      {
        name: 'Categories',
        description: 'Category management',
      },
      {
        name: 'Series',
        description: 'Video series and content management',
      },
    ],
  },
  apis: ['./src/app.ts', './src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
