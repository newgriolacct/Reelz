import { DexPair } from './dexscreener';

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

interface CacheEntry {
  data: DexPair[];
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();

  get(key: string): DexPair[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: DexPair[]): void {
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
