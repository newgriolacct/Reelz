import { DexPair } from './dexscreener';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes default (increased to reduce API calls)

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl?: number; // Custom time-to-live
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('api_cache');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          this.cache.set(key, value);
        });
        console.log(`Loaded ${this.cache.size} cached items from storage`);
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, CacheEntry> = {};
      this.cache.forEach((value, key) => {
        // Only save recent cache entries (within last 2 hours)
        if (Date.now() - value.timestamp < 2 * 60 * 60 * 1000) {
          data[key] = value;
        }
      });
      localStorage.setItem('api_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  get<T = DexPair[]>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    const cacheDuration = entry.ttl || CACHE_DURATION;
    
    if (now - entry.timestamp > cacheDuration) {
      this.cache.delete(key);
      this.saveToStorage();
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
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem('api_cache');
  }
}

export const apiCache = new APICache();
export const tokenCache = apiCache; // Alias for token caching
