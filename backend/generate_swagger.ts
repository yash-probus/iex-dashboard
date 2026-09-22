import app from './src/app';
import listEndpoints from 'express-list-endpoints';
import fs from 'fs';
import path from 'path';

// Get all endpoints
const endpoints = listEndpoints(app as any);

const swaggerDoc: any = {
  openapi: '3.0.0',
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
  paths: {}
};

endpoints.forEach((endpoint) => {
  const pathParts = endpoint.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}'); // convert express /:id to OpenAPI /{id}
  if (!swaggerDoc.paths[pathParts]) {
    swaggerDoc.paths[pathParts] = {};
  }
  
  endpoint.methods.forEach((method) => {
    const lowerMethod = method.toLowerCase();
    if(lowerMethod === 'middleware') return;

    // extract parameters
    const pathParams = (pathParts.match(/\{[a-zA-Z0-9_]+\}/g) || []).map(p => p.replace(/[{}]/g, ''));
    const parameters = pathParams.map(param => ({
      in: 'path',
      name: param,
      required: true,
      schema: { type: 'string' }
    }));

    swaggerDoc.paths[pathParts][lowerMethod] = {
      summary: `Auto-generated ${method} for ${pathParts}`,
      description: 'This endpoint was automatically generated.',
      parameters: parameters,
      responses: {
        '200': {
          description: 'Successful response'
        }
      }
    };
  });
});

const outputPath = path.join(__dirname, 'src', 'swagger_output.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerDoc, null, 2));
console.log(`Successfully generated swagger documentation with ${endpoints.length} routes at ${outputPath}`);
