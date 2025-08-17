export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  corsOrigins: string[];
  storage: {
    path: string;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  storage: {
    path: process.env.STORAGE_PATH || './storage',
  },
};