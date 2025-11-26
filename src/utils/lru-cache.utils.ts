export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    lastAccessed: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    currentSize: number;
    totalRequests: number;
    hitRate: number;
    evictions: number;
}

export class LRUCache<T> {
    private cache: Map<string, CacheEntry<T>>;
    private capacity: number;
    private ttl: number;
    private stats: {
        hits: number;
        misses: number;
        evictions: number;
    };
    private cleanupInterval: NodeJS.Timeout | null;

    constructor(capacity: number = 100, ttlSeconds: number = 60) {
        this.cache = new Map();
        this.capacity = capacity;
        this.ttl = ttlSeconds * 1000;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
        };
        this.cleanupInterval = null;
        this.startCleanupTask();
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.stats.misses++;
            return undefined;
        }

        entry.lastAccessed = Date.now();
        this.cache.delete(key);
        this.cache.set(key, entry);
        this.stats.hits++;

        return entry.value;
    }

    set(key: string, value: T): void {
        const now = Date.now();

        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
                this.stats.evictions++;
            }
        }

        this.cache.set(key, {
            value,
            timestamp: now,
            lastAccessed: now,
        });
    }

    private isExpired(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp > this.ttl;
    }

    clear(): void {
        this.cache.clear();
    }

    getStats(): CacheStats {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            currentSize: this.cache.size,
            totalRequests,
            hitRate: Math.round(hitRate * 100) / 100,
            evictions: this.stats.evictions,
        };
    }

    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
        };
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    private startCleanupTask(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleEntries();
        }, 10000);
    }

    private cleanupStaleEntries(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => {
            this.cache.delete(key);
        });

        if (keysToDelete.length > 0) {
            console.log(`[LRU Cache] Cleaned up ${keysToDelete.length} stale entries`);
        }
    }

    stopCleanupTask(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    size(): number {
        return this.cache.size;
    }
}
