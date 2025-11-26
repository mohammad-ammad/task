import { LRUCache } from '../../utils/lru-cache.utils';
import { asyncQueue } from '../../utils/async-queue.utils';
import { User, CreateUserInput, CacheStatusResponse, PerformanceMetrics } from './users.types';
import { logger } from '../../configs/logger';

const mockUsers: Record<number, User> = {
    1: { id: 1, name: 'John Doe', email: 'john@example.com' },
    2: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    3: { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
};

class UserService {
    private cache: LRUCache<User>;
    private userDatabase: Record<number, User>;
    private performanceMetrics: PerformanceMetrics;
    private nextUserId: number;

    constructor() {
        this.cache = new LRUCache<User>(100, 60);
        this.userDatabase = { ...mockUsers };
        this.nextUserId = 4;
        this.performanceMetrics = {
            requestCount: 0,
            totalResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            averageResponseTime: 0,
        };
    }

    private async simulateDatabaseCall(userId: number): Promise<User | null> {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return this.userDatabase[userId] || null;
    }

    async getUserById(userId: number): Promise<User | null> {
        const startTime = Date.now();

        try {
            const cacheKey = `user:${userId}`;

            const cachedUser = this.cache.get(cacheKey);
            if (cachedUser) {
                this.updatePerformanceMetrics(startTime);
                logger.info(`[UserService] Cache HIT for user ${userId}`);
                return cachedUser;
            }

            logger.info(`[UserService] Cache MISS for user ${userId} - fetching from database`);

            const user = await asyncQueue.enqueue(cacheKey, async () => {
                const recheck = this.cache.get(cacheKey);
                if (recheck) {
                    logger.info(`[UserService] User ${userId} found in cache during queue processing`);
                    return recheck;
                }

                const fetchedUser = await this.simulateDatabaseCall(userId);

                if (fetchedUser) {
                    this.cache.set(cacheKey, fetchedUser);
                    logger.info(`[UserService] User ${userId} fetched from database and cached`);
                }

                return fetchedUser;
            });

            this.updatePerformanceMetrics(startTime);
            return user;
        } catch (error) {
            this.updatePerformanceMetrics(startTime);
            logger.error(`[UserService] Error fetching user ${userId}:`, error as Error);
            throw error;
        }
    }


    async createUser(input: CreateUserInput): Promise<User> {
        const startTime = Date.now();

        try {
            const newUser: User = {
                id: this.nextUserId++,
                name: input.name,
                email: input.email,
                createdAt: new Date(),
            };

            this.userDatabase[newUser.id] = newUser;

            const cacheKey = `user:${newUser.id}`;
            this.cache.set(cacheKey, newUser);

            logger.info(`[UserService] Created and cached new user ${newUser.id}`);
            this.updatePerformanceMetrics(startTime);
            return newUser;
        } catch (error) {
            this.updatePerformanceMetrics(startTime);
            logger.error('[UserService] Error creating user:', error as Error);
            throw error;
        }
    }

    async getAllUsers(): Promise<User[]> {
        return Object.values(this.userDatabase);
    }

    clearCache(): void {
        this.cache.clear();
        console.log('[UserService] Cache cleared');
    }

    getCacheStatus(): CacheStatusResponse {
        const cacheStats = this.cache.getStats();
        const queueStats = asyncQueue.getStats();

        return {
            cacheSize: cacheStats.currentSize,
            cacheHits: cacheStats.hits,
            cacheMisses: cacheStats.misses,
            totalRequests: cacheStats.totalRequests,
            hitRate: cacheStats.hitRate,
            evictions: cacheStats.evictions,
            averageResponseTime: this.performanceMetrics.averageResponseTime,
            queueStats: {
                queueSize: queueStats.queueSize,
                processingCount: queueStats.processingCount,
                activeCount: queueStats.activeCount,
            },
        };
    }

    private updatePerformanceMetrics(startTime: number): void {
        const responseTime = Date.now() - startTime;

        this.performanceMetrics.requestCount++;
        this.performanceMetrics.totalResponseTime += responseTime;
        this.performanceMetrics.minResponseTime = Math.min(
            this.performanceMetrics.minResponseTime,
            responseTime
        );
        this.performanceMetrics.maxResponseTime = Math.max(
            this.performanceMetrics.maxResponseTime,
            responseTime
        );
        this.performanceMetrics.averageResponseTime =
            Math.round((this.performanceMetrics.totalResponseTime / this.performanceMetrics.requestCount) * 100) / 100;
    }

    getPerformanceMetrics(): PerformanceMetrics {
        return { ...this.performanceMetrics };
    }

    resetPerformanceMetrics(): void {
        this.performanceMetrics = {
            requestCount: 0,
            totalResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            averageResponseTime: 0,
        };
    }
}

export const userService = new UserService();
