import { Token } from "@/types/token";
import { fetchMixedDexTokens } from "./dexscreener";
import { convertDexPairToToken } from "@/types/token";
import { tokenCache } from "./apiCache";

/**
 * Fetch trending tokens - Uses DexScreener mixed endpoints with cache
 */
export const fetchAggregatedTrending = async (chainId?: string): Promise<Token[]> => {
  const network = chainId || 'solana';
  const cacheKey = `trending_dex_${network}`;
  
  console.log(`Fetching DexScreener trending tokens (30k-10M cap)...`);
  
  try {
    const pairs = await fetchMixedDexTokens();
    
    if (pairs.length > 0) {
      // Select 5 random tokens for trending
      const selected = pairs.slice(0, 5);
      const converted = selected.map(pair => convertDexPairToToken(pair));
      
      // Cache successful response
      tokenCache.set(cacheKey, converted);
      return converted;
    }
  } catch (error) {
    console.error('DexScreener error, checking cache:', error);
  }
  
  // Try cache on failure
  const cached = tokenCache.get<Token[]>(cacheKey);
  if (cached) {
    console.log('Using cached trending tokens');
    return cached;
  }
  
  console.warn('No trending tokens available');
  return [];
};

/**
 * Fetch tokens for scrolling - INFINITE SCROLLING like TikTok
 * LAZY LOADING: Fetches fresh tokens as you scroll
 * RECYCLING: When API returns nothing, shuffles and reuses existing tokens
 * CACHE: 1 hour TTL - fresh data when you return later
 */
let tokenPool: Token[] = [];

export const fetchAggregatedRandom = async (chainId?: string, reset: boolean = false): Promise<Token[]> => {
  const network = chainId || 'solana';
  
  // Reset pool when network changes
  if (reset) {
    tokenPool = [];
  }
  
  console.log(`🔄 Fetching fresh DexScreener tokens (pool: ${tokenPool.length})...`);
  
  try {
    // Try to fetch fresh tokens from DexScreener
    const pairs = await fetchMixedDexTokens();
    
    if (pairs.length > 0) {
      const converted = pairs.map(pair => convertDexPairToToken(pair));
      
      // ALWAYS ADD new tokens to pool (don't filter duplicates)
      // This allows fresh data and more variety
      tokenPool = [...tokenPool, ...converted];
      
      // Keep pool size reasonable (max 100 tokens)
      if (tokenPool.length > 100) {
        tokenPool = tokenPool.slice(-100);
      }
      
      // Cache the pool with 1 hour TTL
      const cacheKey = `token_pool_${network}`;
      tokenCache.set(cacheKey, tokenPool, 60 * 60 * 1000);
      
      // Shuffle and return batch of 20 tokens
      const shuffled = [...converted].sort(() => 0.5 - Math.random());
      const batch = shuffled.slice(0, 20);
      console.log(`✅ Fetched ${batch.length} fresh tokens (pool now: ${tokenPool.length})`);
      
      return batch;
    }
  } catch (error) {
    console.error('DexScreener error, using recycled tokens:', error);
  }
  
  // RECYCLING: If API fails or returns nothing, shuffle from pool
  if (tokenPool.length > 0) {
    console.log('♻️ Recycling tokens from pool - infinite scroll mode');
    const shuffled = [...tokenPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 20);
  }
  
  // Try to restore from cache if pool is empty
  const cacheKey = `token_pool_${network}`;
  const cached = tokenCache.get<Token[]>(cacheKey);
  if (cached && cached.length > 0) {
    console.log('📦 Restoring token pool from cache');
    tokenPool = cached;
    const shuffled = [...tokenPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 20);
  }
  
  console.warn('No tokens available - pool is empty');
  return [];
};
