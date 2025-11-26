import app from './app';
import config from './configs/config';
import { logger } from './configs/logger';

const PORT = config.port;

const server = app.listen(PORT, () => {
    logger.info('🚀 Server started', { logger: 'Main', function: 'app.listen', data: { port: PORT, env: config.env } });
});

process.on('SIGTERM', async () => {
    server.close(() => {
        logger.info('🚀 Server stopped', { logger: 'Main', function: 'process.on(SIGTERM)' });
    });
});

process.on('SIGINT', async () => {
    server.close(() => {
        logger.info('🚀 Server stopped', { logger: 'Main', function: 'process.on(SIGINT)' });
    });
});