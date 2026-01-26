import { Redis } from "ioredis";

const CACHE_PREFIX = "nt:";

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();
  private isConnected = false;

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        this.redis.on("connect", () => {
          this.isConnected = true;
          console.log("✅ Cache: Redis connected for API caching");
        });
        this.redis.on("error", (err) => {
          console.error("❌ Cache: Redis error:", err.message);
          this.isConnected = false;
        });
      } catch (error) {
        console.log("⚠️ Cache: Using in-memory cache (Redis unavailable)");
      }
    } else {
      console.log("⚠️ Cache: Using in-memory cache (no REDIS_URL)");
    }
  }

  private getKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);

    if (this.redis && this.isConnected) {
      try {
        const data = await this.redis.get(fullKey);
        if (data) {
          return JSON.parse(data) as T;
        }
        return null;
      } catch (error) {
        console.error("Cache get error:", error);
      }
    }

    const cached = this.memoryCache.get(fullKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    if (cached) {
      this.memoryCache.delete(fullKey);
    }
    return null;
  }

  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    const fullKey = this.getKey(key);

    if (this.redis && this.isConnected) {
      try {
        await this.redis.setex(fullKey, ttlSeconds, JSON.stringify(data));
        return;
      } catch (error) {
        console.error("Cache set error:", error);
      }
    }

    this.memoryCache.set(fullKey, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);

    if (this.redis && this.isConnected) {
      try {
        await this.redis.del(fullKey);
      } catch (error) {
        console.error("Cache delete error:", error);
      }
    }

    this.memoryCache.delete(fullKey);
  }

  async deletePattern(pattern: string): Promise<void> {
    const fullPattern = this.getKey(pattern);

    if (this.redis && this.isConnected) {
      try {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error("Cache deletePattern error:", error);
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(fullPattern.replace("*", ""))) {
        this.memoryCache.delete(key);
      }
    }
  }

  cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires < now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cache = new CacheService();

setInterval(() => {
  cache.cleanupMemoryCache();
}, 60000);

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 900,
  HOUR: 3600,
  DAY: 86400,
};

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await queryFn();
  await cache.set(key, result, ttlSeconds);
  return result;
}
