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
 * Fetch tokens for scrolling - Uses DexScreener mixed endpoints with cache
 */
let tokenOffset = 0;
let cachedPairs: Token[] = [];

export const fetchAggregatedRandom = async (chainId?: string, reset: boolean = false): Promise<Token[]> => {
  const network = chainId || 'solana';
  
  // Reset when switching networks
  if (reset) {
    tokenOffset = 0;
    cachedPairs = [];
  }
  
  const cacheKey = `tokens_dex_${network}`;
  
  console.log(`Fetching DexScreener tokens (offset: ${tokenOffset}, mcRange: 30k-10M)...`);
  
  // If we have cached pairs, return the next batch
  if (cachedPairs.length > tokenOffset) {
    const batch = cachedPairs.slice(tokenOffset, tokenOffset + 20);
    if (batch.length > 0) {
      tokenOffset += 20;
      return batch;
    }
  }
  
  // Fetch new data if cache is empty or exhausted
  try {
    const pairs = await fetchMixedDexTokens();
    
    if (pairs.length > 0) {
      const converted = pairs.map(pair => convertDexPairToToken(pair));
      
      // Store all converted pairs
      cachedPairs = converted;
      
      // Cache the full dataset
      tokenCache.set(cacheKey, converted);
      
      // Return first batch
      const batch = converted.slice(0, 20);
      tokenOffset = 20;
      
      return batch;
    }
  } catch (error) {
    console.error('DexScreener error, checking cache:', error);
  }
  
  // Try cache on failure
  const cached = tokenCache.get<Token[]>(cacheKey);
  if (cached && cached.length > 0) {
    console.log('Using cached tokens');
    cachedPairs = cached;
    const batch = cached.slice(tokenOffset, tokenOffset + 20);
    tokenOffset += 20;
    return batch;
  }
  
  console.warn('No tokens available');
  return [];
};
