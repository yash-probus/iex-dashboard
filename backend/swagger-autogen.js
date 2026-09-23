const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'IEX Dashboard API',
    description: 'API documentation for the IEX Dashboard platform generated automatically.',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
    {
      url: 'http://13.206.77.155:5000',
      description: 'Production Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const outputFile = './src/swagger_output.json';
const endpointsFiles = ['./src/app.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);
