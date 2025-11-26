export enum Environment {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    LOCAL = 'local',
}

export interface Config {
    env: Environment;
    port: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isLocal: boolean;
}