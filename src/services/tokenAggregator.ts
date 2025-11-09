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
 * Fetch tokens for scrolling - Fetches fresh tokens from DexScreener on each call
 * LAZY LOADING: Fetches new tokens as you scroll, not all at once
 * CACHE: 1 hour TTL - fresh data when you return later
 */
export const fetchAggregatedRandom = async (chainId?: string, reset: boolean = false): Promise<Token[]> => {
  const network = chainId || 'solana';
  const cacheKey = `tokens_dex_${network}_${Date.now()}`;
  
  console.log(`🔄 Fetching fresh DexScreener tokens (mcRange: 30k-10M)...`);
  
  try {
    // Always fetch fresh tokens from DexScreener
    const pairs = await fetchMixedDexTokens();
    
    if (pairs.length > 0) {
      const converted = pairs.map(pair => convertDexPairToToken(pair));
      
      // Cache with 1 hour TTL
      tokenCache.set(cacheKey, converted, 60 * 60 * 1000);
      
      // Return batch of 20 tokens
      const batch = converted.slice(0, 20);
      console.log(`✅ Fetched ${batch.length} fresh tokens`);
      
      return batch;
    }
  } catch (error) {
    console.error('DexScreener error:', error);
  }
  
  console.warn('No tokens available from DexScreener');
  return [];
};
