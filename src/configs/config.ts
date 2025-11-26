import dotenv from 'dotenv';
import { z } from 'zod';
import { Config, Environment } from '../types';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(Environment).default(Environment.LOCAL),
    PORT: z.string(),
});

const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        console.error('❌ Invalid environment variables:', error);
        process.exit(1);
    }
};

const env = parseEnv();

export const config: Config = {
    env: env.NODE_ENV,
    port: env.PORT,
    isDevelopment: env.NODE_ENV === Environment.DEVELOPMENT,
    isProduction: env.NODE_ENV === Environment.PRODUCTION,
    isLocal: env.NODE_ENV === Environment.LOCAL,
} as const;

export default config;