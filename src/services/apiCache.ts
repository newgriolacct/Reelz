import { DexPair } from './dexscreener';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes default (increased to reduce API calls)

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl?: number; // Custom time-to-live
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();

  get<T = DexPair[]>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    const cacheDuration = entry.ttl || CACHE_DURATION;
    
    if (now - entry.timestamp > cacheDuration) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T = any>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new APICache();
export const tokenCache = apiCache; // Alias for token caching
