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
 * NO POOL CAP: Grows indefinitely for maximum variety
 * RECYCLING: Only after 200+ tokens or when API fails
 * API SAFE: Respects rate limits with timeouts
 */
let tokenPool: Token[] = [];
let tokenIndex = 0; // Track position in pool

export const fetchAggregatedRandom = async (chainId?: string, reset: boolean = false): Promise<Token[]> => {
  const network = chainId || 'solana';
  
  // Reset pool when network changes
  if (reset) {
    tokenPool = [];
    tokenIndex = 0;
  }
  
  console.log(`🔄 Fetching tokens (pool: ${tokenPool.length}, shown: ${tokenIndex})...`);
  
  // If we have fresh unseen tokens in pool, use those first
  if (tokenIndex < tokenPool.length) {
    const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
    if (batch.length === 20) {
      tokenIndex += 20;
      console.log(`✅ Using ${batch.length} tokens from pool (${tokenPool.length - tokenIndex} remaining)`);
      return batch;
    }
  }
  
  try {
    // Try to fetch fresh tokens from DexScreener
    const pairs = await fetchMixedDexTokens();
    
    if (pairs.length > 0) {
      const converted = pairs.map(pair => convertDexPairToToken(pair));
      
      // NO CAP: Add all new tokens to pool
      tokenPool = [...tokenPool, ...converted];
      
      // Cache the pool with 1 hour TTL
      const cacheKey = `token_pool_${network}`;
      tokenCache.set(cacheKey, tokenPool, 60 * 60 * 1000);
      
      // Return next batch from the new tokens
      const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
      tokenIndex += 20;
      
      console.log(`✅ Fetched ${converted.length} fresh tokens | Pool: ${tokenPool.length} | Shown: ${tokenIndex}`);
      
      return batch;
    }
  } catch (error) {
    console.error('DexScreener error:', error);
  }
  
  // RECYCLING: Only if we've shown 200+ tokens OR no pool at all
  if (tokenPool.length > 0) {
    if (tokenIndex >= 200) {
      console.log('♻️ Recycling: Shown 200+ tokens, reshuffling pool...');
      tokenPool = [...tokenPool].sort(() => 0.5 - Math.random());
      tokenIndex = 0;
    }
    
    // Return next batch (recycled or fresh)
    const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
    tokenIndex += 20;
    
    console.log(`📦 Returning ${batch.length} tokens (recycled: ${tokenIndex > tokenPool.length})`);
    return batch;
  }
  
  // Try to restore from cache if pool is empty
  const cacheKey = `token_pool_${network}`;
  const cached = tokenCache.get<Token[]>(cacheKey);
  if (cached && cached.length > 0) {
    console.log('📦 Restoring token pool from cache');
    tokenPool = cached;
    tokenIndex = 0;
    const batch = tokenPool.slice(0, 20);
    tokenIndex = 20;
    return batch;
  }
  
  console.warn('No tokens available');
  return [];
};
