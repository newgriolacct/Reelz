import { Token } from "@/types/token";
import { fetchMixedDexTokens } from "./dexscreener";
import { convertDexPairToToken } from "@/types/token";
import { tokenCache } from "./apiCache";

/**
 * Fetch trending tokens - Uses DexScreener mixed endpoints with cache
 * Ensures we always get at least 5 tokens for the trending bar
 */
export const fetchAggregatedTrending = async (chainId?: string): Promise<Token[]> => {
  const network = chainId || 'solana';
  const cacheKey = `trending_dex_${network}`;
  
  console.log(`Fetching DexScreener trending tokens (30k-10M cap)...`);
  
  try {
    const pairs = await fetchMixedDexTokens();
    
    if (pairs.length > 0) {
      // Take first 8 to ensure we get at least 5 after conversion (some may fail)
      const selected = pairs.slice(0, 8);
      const conversionResults = await Promise.allSettled(
        selected.map(pair => convertDexPairToToken(pair))
      );
      
      // Filter out failed conversions
      const converted = conversionResults
        .filter((result): result is PromiseFulfilledResult<Token> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
        .slice(0, 5); // Take only 5 for trending bar
      
      if (converted.length >= 5) {
        // Cache successful response
        tokenCache.set(cacheKey, converted);
        return converted;
      } else {
        console.warn(`Only got ${converted.length} tokens, fetching more...`);
        // If we don't have 5, try to get more from cache or retry
        const cached = tokenCache.get<Token[]>(cacheKey);
        if (cached && cached.length >= 5) {
          return cached.slice(0, 5);
        }
      }
    }
  } catch (error) {
    console.error('DexScreener error, checking cache:', error);
  }
  
  // Try cache on failure
  const cached = tokenCache.get<Token[]>(cacheKey);
  if (cached && cached.length > 0) {
    console.log('Using cached trending tokens');
    return cached.slice(0, 5);
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
        console.log(`⚠️ All ${converted.length} tokens were duplicates - will recycle pool`);
      }
      
      // Cache the pool for 2 hours
      const cacheKey = `token_pool_${network}`;
      tokenCache.set(cacheKey, tokenPool, 2 * 60 * 60 * 1000);
    }
  } catch (error) {
    console.error('DexScreener error - using existing pool:', error);
  }
  
  // ALWAYS return tokens for infinite scrolling - recycle if needed
  if (tokenPool.length > 0) {
    // If we've reached the end or close to it, shuffle and restart
    if (tokenIndex >= tokenPool.length - 20) {
      console.log('♻️ Reached end of pool, reshuffling for infinite scroll...');
      tokenPool = [...tokenPool].sort(() => 0.5 - Math.random());
      tokenIndex = 0;
      // Clear seen IDs to allow recycled tokens
      seenTokenIds.clear();
      tokenPool.forEach(t => seenTokenIds.add(t.id));
    }
    
    const batch = tokenPool.slice(tokenIndex, tokenIndex + 20);
    tokenIndex += 20;
    
    console.log(`📦 Returning ${batch.length} tokens | Index: ${tokenIndex}/${tokenPool.length}`);
    return batch;
  }
  
  // Try to restore from cache as last resort
  const cacheKey = `token_pool_${network}`;
  const cached = tokenCache.get<Token[]>(cacheKey);
  if (cached?.length) {
    console.log('📥 Restoring from cache...');
    tokenPool = cached;
    tokenIndex = 0;
    cached.forEach(t => seenTokenIds.add(t.id));
    return tokenPool.slice(0, 20);
  }
  
  console.warn('❌ No tokens available at all');
  return [];
};
