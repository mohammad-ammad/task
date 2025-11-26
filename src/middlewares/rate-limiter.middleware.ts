/**
 * Sophisticated Rate Limiter Middleware
 * Features:
 * - Token Bucket algorithm for burst traffic handling
 * - 10 requests per minute limit
 * - Burst capacity of 5 requests in 10-second window
 * - Per-IP rate limiting
 */

import { Request, Response, NextFunction } from 'express';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  burstTokens: number;
  lastBurstRefill: number;
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket>;
  private maxTokens: number; // Maximum tokens (10 requests per minute)
  private refillRate: number; // Tokens per millisecond
  private burstCapacity: number; // Burst capacity (5 requests)
  private burstWindow: number; // Burst window in milliseconds (10 seconds)

  constructor() {
    this.buckets = new Map();
    this.maxTokens = 10; // 10 requests per minute
    this.refillRate = 10 / (60 * 1000); // 10 tokens per 60 seconds in milliseconds
    this.burstCapacity = 5; // 5 requests burst
    this.burstWindow = 10 * 1000; // 10 seconds in milliseconds

    // Cleanup old buckets every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get client identifier (IP address)
   * @param req Express request object
   * @returns Client identifier string
   */
  private getClientId(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Get or create token bucket for client
   * @param clientId Client identifier
   * @returns Token bucket
   */
  private getBucket(clientId: string): TokenBucket {
    let bucket = this.buckets.get(clientId);

    if (!bucket) {
      bucket = {
        tokens: this.maxTokens,
        lastRefill: Date.now(),
        burstTokens: this.burstCapacity,
        lastBurstRefill: Date.now(),
      };
      this.buckets.set(clientId, bucket);
    }

    return bucket;
  }

  /**
   * Refill tokens based on time elapsed
   * @param bucket Token bucket
   */
  private refillTokens(bucket: TokenBucket): void {
    const now = Date.now();
    const timeSinceRefill = now - bucket.lastRefill;
    const tokensToAdd = timeSinceRefill * this.refillRate;

    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Refill burst tokens based on time elapsed
   * @param bucket Token bucket
   */
  private refillBurstTokens(bucket: TokenBucket): void {
    const now = Date.now();
    const timeSinceBurstRefill = now - bucket.lastBurstRefill;

    // Reset burst tokens if burst window has passed
    if (timeSinceBurstRefill >= this.burstWindow) {
      bucket.burstTokens = this.burstCapacity;
      bucket.lastBurstRefill = now;
    }
  }

  /**
   * Check if request should be allowed
   * @param clientId Client identifier
   * @returns true if allowed, false if rate limited
   */
  private allowRequest(clientId: string): boolean {
    const bucket = this.getBucket(clientId);

    // Refill tokens
    this.refillTokens(bucket);
    this.refillBurstTokens(bucket);

    // Check burst capacity first
    if (bucket.burstTokens > 0) {
      bucket.burstTokens -= 1;
      bucket.tokens = Math.max(0, bucket.tokens - 1);
      return true;
    }

    // Check regular tokens
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Cleanup old buckets that haven't been used recently
   */
  private cleanup(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [clientId, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > timeout) {
        this.buckets.delete(clientId);
      }
    }
  }

  /**
   * Express middleware for rate limiting
   * @param req Express request
   * @param res Express response
   * @param next Next middleware function
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = this.getClientId(req);
      const allowed = this.allowRequest(clientId);

      if (!allowed) {
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. You have exceeded the maximum number of requests. Please try again later.',
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            limit: `${this.maxTokens} requests per minute with burst capacity of ${this.burstCapacity} requests per ${this.burstWindow / 1000} seconds`,
          },
        });
        return;
      }

      next();
    };
  }

  /**
   * Get current rate limit status for client
   * @param req Express request
   * @returns Rate limit status
   */
  getStatus(req: Request): { remaining: number; burstRemaining: number; resetIn: number } {
    const clientId = this.getClientId(req);
    const bucket = this.getBucket(clientId);
    
    this.refillTokens(bucket);
    this.refillBurstTokens(bucket);

    const resetIn = Math.ceil((this.maxTokens - bucket.tokens) / this.refillRate);

    return {
      remaining: Math.floor(bucket.tokens),
      burstRemaining: bucket.burstTokens,
      resetIn,
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
