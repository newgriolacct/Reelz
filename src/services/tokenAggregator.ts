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
      const converted = await Promise.all(selected.map(pair => convertDexPairToToken(pair)));
      
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
 * TRULY UNIQUE: Filters out duplicate token IDs
 * RECYCLING: Only after 200+ unique tokens shown
 */
let tokenPool: Token[] = [];
let tokenIndex = 0;
const seenTokenIds = new Set<string>();

export const fetchAggregatedRandom = async (chainId?: string, reset: boolean = false): Promise<Token[]> => {
  const network = chainId || 'solana';
  
  if (reset) {
    tokenPool = [];
    tokenIndex = 0;
    seenTokenIds.clear();
  }
  
  console.log(`🔄 Pool: ${tokenPool.length} | Shown: ${tokenIndex} | Unique IDs: ${seenTokenIds.size}`);
  
  // If we have fresh unseen tokens in pool, use those first
  if (tokenIndex < tokenPool.length) {
    const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
    if (batch.length === 20) {
      tokenIndex += 20;
      console.log(`✅ Using ${batch.length} from pool (${tokenPool.length - tokenIndex} remaining)`);
      return batch;
    }
  }
  
  try {
    // Fetch fresh tokens from DexScreener
    const pairs = await fetchMixedDexTokens();
    
    if (pairs.length > 0) {
      const converted = await Promise.all(pairs.map(pair => convertDexPairToToken(pair)));
      
      // FILTER OUT DUPLICATES: Only add tokens we haven't seen
      const newTokens = converted.filter(token => {
        if (seenTokenIds.has(token.id)) {
          return false; // Skip duplicates
        }
        seenTokenIds.add(token.id);
        return true;
      });
      
      if (newTokens.length > 0) {
        // Add only NEW unique tokens to pool
        tokenPool = [...tokenPool, ...newTokens];
        
        console.log(`✅ Added ${newTokens.length} NEW tokens (filtered ${converted.length - newTokens.length} dupes) | Pool: ${tokenPool.length}`);
      } else {
        console.log(`⚠️ All ${converted.length} tokens were duplicates`);
      }
      
      // Cache the pool for 2 hours (increased from 1 hour)
      const cacheKey = `token_pool_${network}`;
      tokenCache.set(cacheKey, tokenPool, 2 * 60 * 60 * 1000);
      
      // Return next batch
      const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
      tokenIndex += 20;
      
      return batch;
    }
  } catch (error) {
    console.error('DexScreener error - using cache:', error);
    
    // On error, try to return from existing pool without making new API calls
    if (tokenPool.length > 0) {
      const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
      tokenIndex += 20;
      return batch;
    }
  }
  
  // RECYCLING: Only after showing 200+ unique tokens
  if (tokenPool.length > 0) {
    if (tokenIndex >= 200) {
      console.log('♻️ Shown 200+ tokens, reshuffling...');
      tokenPool = [...tokenPool].sort(() => 0.5 - Math.random());
      tokenIndex = 0;
    }
    
    const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
    tokenIndex += 20;
    
    console.log(`📦 Returning ${batch.length} tokens | Recycling: ${tokenIndex > tokenPool.length}`);
    return batch;
  }
  
  // Restore from cache
  const cacheKey = `token_pool_${network}`;
  const cached = tokenCache.get<Token[]>(cacheKey);
  if (cached?.length) {
    tokenPool = cached;
    tokenIndex = 0;
    cached.forEach(t => seenTokenIds.add(t.id));
    return tokenPool.slice(0, 20);
  }
  
  return [];
};
