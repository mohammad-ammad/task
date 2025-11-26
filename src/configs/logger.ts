import winston from 'winston';
import config from './config';
import { LogContext } from '../types';

class Logger {
    private winstonLogger: winston.Logger;

    constructor() {
        const consoleFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const logEntry = {
                    timestamp,
                    message,
                    logger: meta.logger || 'Unknown',
                    level,
                    function: meta.function || 'Unknown',
                    workspaceId: meta.workspaceId || null,
                    data: meta.data || null,
                };

                return JSON.stringify(logEntry, null, 2);
            })
        );

        const fileFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const logEntry = {
                    timestamp,
                    message,
                    logger: meta.logger || 'Unknown',
                    level,
                    function: meta.function || 'Unknown',
                    workspaceId: meta.workspaceId || null,
                    errorStack: meta.errorStack || meta.stack || null,
                    data: meta.data || null,
                };

                return JSON.stringify(logEntry, null, 2);
            })
        );

        this.winstonLogger = winston.createLogger({
            level: config.isDevelopment ? 'debug' : 'info',
            transports: [
                ...(config.isLocal ? [
                    new winston.transports.Console({
                        format: consoleFormat
                    })
                ] : []),
                ...(config.isProduction ? [
                    new winston.transports.File({
                        filename: 'logs/logs.log',
                        format: fileFormat
                    })
                ] : []),
            ],
        });
    }

    private log(level: string, message: string, context: LogContext = {}) {
        this.winstonLogger.log(level, message, context);
    }

    info(message: string, context: LogContext = {}) {
        this.log('info', message, context);
    }

    error(message: string, error?: Error, context: LogContext = {}) {
        const errorContext = {
            ...context,
            errorStack: error?.stack || context.errorStack
        };
        this.log('error', message, errorContext);
    }

    warn(message: string, context: LogContext = {}) {
        this.log('warn', message, context);
    }

    debug(message: string, context: LogContext = {}) {
        this.log('debug', message, context);
    }
}

export const logger = new Logger();
export type { LogContext };