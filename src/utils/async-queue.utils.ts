export interface QueueTask<T> {
    id: string;
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

export class AsyncQueue {
    private queue: Map<string, QueueTask<any>[]>;
    private processing: Set<string>;
    private concurrencyLimit: number;
    private activeCount: number;

    constructor(concurrencyLimit: number = 10) {
        this.queue = new Map();
        this.processing = new Set();
        this.concurrencyLimit = concurrencyLimit;
        this.activeCount = 0;
    }

    async enqueue<T>(id: string, task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (this.processing.has(id)) {
                const existingQueue = this.queue.get(id) || [];
                existingQueue.push({ id, execute: task, resolve, reject });
                this.queue.set(id, existingQueue);
                return;
            }

            this.processing.add(id);

            if (this.activeCount < this.concurrencyLimit) {
                this.activeCount++;
                this.processTask(id, task, resolve, reject);
            } else {
                const existingQueue = this.queue.get(id) || [];
                existingQueue.push({ id, execute: task, resolve, reject });
                this.queue.set(id, existingQueue);
            }
        });
    }

    private async processTask<T>(
        id: string,
        task: () => Promise<T>,
        resolve: (value: T) => void,
        reject: (error: Error) => void
    ): Promise<void> {
        try {
            const result = await task();

            resolve(result);

            const waitingTasks = this.queue.get(id);
            if (waitingTasks && waitingTasks.length > 0) {
                waitingTasks.forEach((waitingTask) => {
                    waitingTask.resolve(result);
                });
                this.queue.delete(id);
            }
        } catch (error) {
            reject(error as Error);

            const waitingTasks = this.queue.get(id);
            if (waitingTasks && waitingTasks.length > 0) {
                waitingTasks.forEach((waitingTask) => {
                    waitingTask.reject(error as Error);
                });
                this.queue.delete(id);
            }
        } finally {
            this.processing.delete(id);
            this.activeCount--;

            this.processNext();
        }
    }

    private processNext(): void {
        if (this.activeCount >= this.concurrencyLimit) {
            return;
        }

        for (const [id, tasks] of this.queue.entries()) {
            if (!this.processing.has(id) && tasks.length > 0) {
                const task = tasks.shift();
                if (task) {
                    this.processing.add(id);
                    this.activeCount++;

                    if (tasks.length === 0) {
                        this.queue.delete(id);
                    }

                    this.processTask(id, task.execute, task.resolve, task.reject);
                    break;
                }
            }
        }
    }

    getStats(): {
        queueSize: number;
        processingCount: number;
        activeCount: number;
    } {
        let totalQueued = 0;
        for (const tasks of this.queue.values()) {
            totalQueued += tasks.length;
        }

        return {
            queueSize: totalQueued,
            processingCount: this.processing.size,
            activeCount: this.activeCount,
        };
    }

    isProcessing(id: string): boolean {
        return this.processing.has(id);
    }

    clear(): void {
        this.queue.clear();
    }
}

export const asyncQueue = new AsyncQueue(10);
