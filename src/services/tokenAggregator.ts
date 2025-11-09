import { DexPair } from './dexscreener';
import { 
  fetchTrendingTokens as fetchDexTrending,
  fetchRandomTokens as fetchDexRandom 
} from './dexscreener';
import { 
  fetchGeckoTrendingPools,
  fetchGeckoNewPools 
} from './geckoterminal';

const MIN_MARKET_CAP = 5000; // $5k minimum to show more tokens

/**
 * Aggregate trending tokens from all APIs
 */
export const fetchAggregatedTrending = async (chainId?: string): Promise<DexPair[]> => {
  try {
    console.log(`[Trending] Fetching for chain: ${chainId || 'all'}`);
    
    // Fetch from all sources in parallel
    const [dexTrending, geckoTrending] = await Promise.allSettled([
      fetchDexTrending(chainId),
      fetchGeckoTrendingPools(chainId),
    ]);
    
    const allPairs: DexPair[] = [];
    const seenPairAddresses = new Set<string>();
    
    // Add DexScreener trending
    if (dexTrending.status === 'fulfilled') {
      console.log(`[Trending] DexScreener returned ${dexTrending.value.length} pairs`);
      dexTrending.value.forEach(pair => {
        const marketCap = pair.marketCap || pair.fdv || 0;
        console.log(`[Trending] ${pair.baseToken.symbol} - Chain: ${pair.chainId}, MCap: $${marketCap}`);
        if (!seenPairAddresses.has(pair.pairAddress) && marketCap >= MIN_MARKET_CAP) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        } else if (marketCap < MIN_MARKET_CAP) {
          console.log(`[Trending] Filtered out ${pair.baseToken.symbol} - MCap too low`);
        }
      });
    }
    
    // Add GeckoTerminal trending
    if (geckoTrending.status === 'fulfilled') {
      console.log(`[Trending] GeckoTerminal returned ${geckoTrending.value.length} pairs`);
      geckoTrending.value.forEach(pair => {
        const marketCap = pair.marketCap || pair.fdv || 0;
        if (!seenPairAddresses.has(pair.pairAddress) && marketCap >= MIN_MARKET_CAP) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        }
      });
    }
    
    console.log(`[Trending] Total pairs after filtering: ${allPairs.length}`);
    
    // Sort by liquidity and volume
    return allPairs
      .sort((a, b) => {
        const liquidityA = a.liquidity?.usd || 0;
        const liquidityB = b.liquidity?.usd || 0;
        const volumeA = a.volume?.h24 || 0;
        const volumeB = b.volume?.h24 || 0;
        return (liquidityB + volumeB) - (liquidityA + volumeA);
      })
      .slice(0, 20);
  } catch (error) {
    console.error('Error aggregating trending tokens:', error);
    return [];
  }
};

/**
 * Aggregate random tokens from all APIs for scrolling feed
 */
export const fetchAggregatedRandom = async (chainId?: string): Promise<DexPair[]> => {
  try {
    // Fetch from all sources in parallel
    const [dexRandom, geckoNew] = await Promise.allSettled([
      fetchDexRandom(chainId),
      fetchGeckoNewPools(chainId),
    ]);
    
    const allPairs: DexPair[] = [];
    const seenPairAddresses = new Set<string>();
    
    // Add DexScreener random tokens
    if (dexRandom.status === 'fulfilled') {
      dexRandom.value.forEach(pair => {
        const marketCap = pair.marketCap || pair.fdv || 0;
        if (!seenPairAddresses.has(pair.pairAddress) && marketCap >= MIN_MARKET_CAP) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        }
      });
    }
    
    // Add GeckoTerminal new pools
    if (geckoNew.status === 'fulfilled') {
      geckoNew.value.forEach(pair => {
        const marketCap = pair.marketCap || pair.fdv || 0;
        if (!seenPairAddresses.has(pair.pairAddress) && marketCap >= MIN_MARKET_CAP) {
          allPairs.push(pair);
          seenPairAddresses.add(pair.pairAddress);
        }
      });
    }
    
    // Shuffle for variety
    return allPairs.sort(() => Math.random() - 0.5).slice(0, 50);
  } catch (error) {
    console.error('Error aggregating random tokens:', error);
    return [];
  }
};
