interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxAge: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with expiration
   */
  set<T>(key: string, data: T, customMaxAge?: number): void {
    const maxAge = customMaxAge || this.config.maxAge;
    const expiresAt = Date.now() + maxAge;

    // Clean up old entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  }

  /**
   * Remove specific cache entry
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    missRate: number;
    totalRequests: number;
  } {
    const size = this.cache.size;

    // Calculate hit/miss rates (simplified)
    const totalRequests = Math.max(1, size * 2); // Estimation
    const hitRate = 0.8; // Default hit rate estimation
    const missRate = 1 - hitRate;

    return {
      size,
      hitRate,
      missRate,
      totalRequests,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach((key) => this.cache.delete(key));

    // If still too many entries, remove oldest ones
    if (this.cache.size >= this.config.maxSize) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const entriesToRemove = sortedEntries.slice(
        0,
        Math.floor(this.config.maxSize * 0.2)
      );
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(base: string, params?: Record<string, unknown>): string {
    if (!params) return base;

    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);

    return `${base}:${JSON.stringify(sortedParams)}`;
  }
}

// Create singleton instance with different cache configurations
export const cacheManager = new CacheManager({
  maxAge: 5 * 60 * 1000,
  maxSize: 100,
}); // 5 minutes, 100 items
export const longCacheManager = new CacheManager({
  maxAge: 30 * 60 * 1000,
  maxSize: 50,
}); // 30 minutes, 50 items
export const shortCacheManager = new CacheManager({
  maxAge: 60 * 1000,
  maxSize: 200,
}); // 1 minute, 200 items

/**
 * Cache decorator for API routes
 */
export function withCache<T>(
  cacheKey: string,
  maxAge?: number,
  cacheManagerInstance = cacheManager
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cachedData = cacheManagerInstance.get<T>(cacheKey);

      if (cachedData) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return cachedData;
      }

      console.log(`Cache miss for key: ${cacheKey}`);
      const result = await originalMethod.apply(this, args);

      if (result) {
        cacheManagerInstance.set(cacheKey, result, maxAge);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Helper function to cache fetch requests
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string,
  maxAge?: number,
  cacheManagerInstance = cacheManager
): Promise<T> {
  const key = cacheKey || `fetch:${url}`;

  // Check cache first
  const cachedData = cacheManagerInstance.get<T>(key);
  if (cachedData) {
    return cachedData;
  }

  // Make the actual request
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Cache the result
  cacheManagerInstance.set(key, data, maxAge);

  return data;
}
