export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface CacheStatusResponse {
  cacheSize: number;
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  hitRate: number;
  evictions: number;
  averageResponseTime: number;
  queueStats: {
    queueSize: number;
    processingCount: number;
    activeCount: number;
  };
}

export interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  averageResponseTime: number;
}
