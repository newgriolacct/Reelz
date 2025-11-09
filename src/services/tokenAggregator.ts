import { DexPair } from './dexscreener';
import { 
  fetchTrendingTokens as fetchDexTrending,
  fetchRandomTokens as fetchDexRandom 
} from './dexscreener';
import { 
  fetchGeckoTrendingPools,
  fetchGeckoNewPools 
} from './geckoterminal';
import { apiCache } from './apiCache';

const MIN_MARKET_CAP = 30000; // $30k minimum market cap - filter out low caps

/**
 * Aggregate trending tokens from all APIs with caching
 */
export const fetchAggregatedTrending = async (chainId?: string): Promise<DexPair[]> => {
  const cacheKey = `trending_${chainId || 'all'}`;
  
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    // Fetch from all sources in parallel
    const [dexTrending, geckoTrending] = await Promise.allSettled([
      fetchDexTrending(chainId),
      fetchGeckoTrendingPools(chainId),
    ]);
    
    const allPairs: DexPair[] = [];
    const seenPairAddresses = new Set<string>();
    
    // Add DexScreener trending - use MIN_MARKET_CAP filter for trending
    if (dexTrending.status === 'fulfilled') {
      dexTrending.value.forEach(pair => {
        const marketCap = pair.marketCap || pair.fdv || 0;
        if (!seenPairAddresses.has(pair.pairAddress) && marketCap >= MIN_MARKET_CAP) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        }
      });
    }
    
    // Add GeckoTerminal trending - use MIN_MARKET_CAP filter for trending
    if (geckoTrending.status === 'fulfilled') {
      geckoTrending.value.forEach(pair => {
        const marketCap = pair.marketCap || pair.fdv || 0;
        if (!seenPairAddresses.has(pair.pairAddress) && marketCap >= MIN_MARKET_CAP) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        }
      });
    }
    
    // Sort by liquidity and volume
    const result = allPairs
      .sort((a, b) => {
        const liquidityA = a.liquidity?.usd || 0;
        const liquidityB = b.liquidity?.usd || 0;
        const volumeA = a.volume?.h24 || 0;
        const volumeB = b.volume?.h24 || 0;
        return (liquidityB + volumeB) - (liquidityA + volumeA);
      })
      .slice(0, 20); // Increased to 20 for trending
    
    // Cache the result
    apiCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error aggregating trending tokens:', error);
    return [];
  }
};

/**
 * Aggregate random tokens from all APIs for scrolling feed
 * Note: No caching for random feed to ensure variety on scroll
 */
export const fetchAggregatedRandom = async (chainId?: string): Promise<DexPair[]> => {
  // Don't cache random tokens - we want fresh data each time for infinite scroll
  
  try {
    // Fetch from both sources - DexScreener + GeckoTerminal for reliability
    const [dexRandom, geckoNew] = await Promise.allSettled([
      fetchDexRandom(chainId),
      fetchGeckoNewPools(chainId),
    ]);
    
    const allPairs: DexPair[] = [];
    const seenPairAddresses = new Set<string>();
    
    // Add DexScreener random tokens
    if (dexRandom.status === 'fulfilled') {
      dexRandom.value.forEach(pair => {
        if (!seenPairAddresses.has(pair.pairAddress)) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        }
      });
    } else {
      console.warn('DexScreener random tokens failed:', dexRandom.reason);
    }
    
    // Add GeckoTerminal new pools - filter by $30k+ market cap here
    if (geckoNew.status === 'fulfilled') {
      geckoNew.value.forEach(pair => {
        const marketCap = pair.marketCap || pair.fdv || 0;
        if (!seenPairAddresses.has(pair.pairAddress) && marketCap >= 30000) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        }
      });
    } else {
      console.warn('GeckoTerminal new pools failed:', geckoNew.reason);
    }
    
    console.log(`Total pairs collected: ${allPairs.length}`);
    
    // Shuffle for variety and return up to 100 tokens
    const result = allPairs.sort(() => Math.random() - 0.5).slice(0, 100);
    
    return result;
  } catch (error) {
    console.error('Error aggregating random tokens:', error);
    return [];
  }
};
