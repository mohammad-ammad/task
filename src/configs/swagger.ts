import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';
import config from './config';

const options: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Coding tasks',
            version: '1.0.0',
            description: 'API documentation',
        },
        servers: [
            {
                url: `http://localhost:${config.port}/v1`,
                description: `${config.env} server`,
            },
        ],
    },
    apis: ['./src/modules/**/*.controller.ts', './src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);