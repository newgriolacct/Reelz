import { DexPair } from './dexscreener';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();

  get<T = DexPair[]>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T = any>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new APICache();
export const tokenCache = apiCache; // Alias for token caching
