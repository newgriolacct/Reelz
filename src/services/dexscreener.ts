export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
  };
  priceChange: {
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ platform: string; handle: string }>;
  };
}

export interface DexScreenerResponse {
  pairs: DexPair[];
}

const API_BASE = 'https://api.dexscreener.com/latest/dex';

interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{
    type: string;
    label: string;
    url: string;
  }>;
}

interface Ad {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
}

interface BoostedToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{
    type: string;
    label: string;
    url: string;
  }>;
}

/**
 * Fetch trending Solana tokens using the backend proxy
 * Uses token-profiles endpoint which is publicly accessible
 */
export const fetchSolanaTrending = async (): Promise<DexPair[]> => {
  try {
    const backendUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-tokens?type=profiles`;
    
    console.log('Fetching Solana trending via backend...');
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data: DexScreenerResponse = await response.json();
    console.log(`Received ${data.pairs?.length || 0} trending Solana tokens`);
    
    // Return the pairs, limiting to 10
    return data.pairs?.slice(0, 10) || [];
  } catch (error) {
    console.error('Error fetching Solana trending tokens:', error);
    throw error;
  }
};

/**
 * Fetch random diverse tokens for scrolling feed
 * Combines multiple endpoints for maximum variety
 * @param chainId - Optional chain filter
 */
export const fetchRandomTokens = async (chainId?: string): Promise<DexPair[]> => {
  try {
    // Fetch from all endpoints in parallel for speed
    const [topBoostsRes, latestBoostsRes, adsRes, profilesRes] = await Promise.allSettled([
      fetch('https://api.dexscreener.com/token-boosts/top/v1'),
      fetch('https://api.dexscreener.com/token-boosts/latest/v1'),
      fetch('https://api.dexscreener.com/ads/latest/v1'),
      fetch('https://api.dexscreener.com/token-profiles/latest/v1'),
    ]);
    
    // Collect all token addresses from all endpoints
    const allTokenAddresses: Set<string> = new Set();
    const tokensByChain: Map<string, string[]> = new Map();
    
    // Process top boosts
    if (topBoostsRes.status === 'fulfilled' && topBoostsRes.value.ok) {
      const data: BoostedToken[] = await topBoostsRes.value.json();
      data.forEach(token => {
        allTokenAddresses.add(token.tokenAddress);
        const chain = token.chainId.toLowerCase();
        if (!tokensByChain.has(chain)) tokensByChain.set(chain, []);
        tokensByChain.get(chain)?.push(token.tokenAddress);
      });
    }
    
    // Process latest boosts
    if (latestBoostsRes.status === 'fulfilled' && latestBoostsRes.value.ok) {
      const data: BoostedToken[] = await latestBoostsRes.value.json();
      data.forEach(token => {
        allTokenAddresses.add(token.tokenAddress);
        const chain = token.chainId.toLowerCase();
        if (!tokensByChain.has(chain)) tokensByChain.set(chain, []);
        tokensByChain.get(chain)?.push(token.tokenAddress);
      });
    }
    
    // Process ads
    if (adsRes.status === 'fulfilled' && adsRes.value.ok) {
      const data: Ad[] = await adsRes.value.json();
      data.forEach(token => {
        allTokenAddresses.add(token.tokenAddress);
        const chain = token.chainId.toLowerCase();
        if (!tokensByChain.has(chain)) tokensByChain.set(chain, []);
        tokensByChain.get(chain)?.push(token.tokenAddress);
      });
    }
    
    // Process token profiles
    if (profilesRes.status === 'fulfilled' && profilesRes.value.ok) {
      const data: TokenProfile[] = await profilesRes.value.json();
      data.forEach(token => {
        allTokenAddresses.add(token.tokenAddress);
        const chain = token.chainId.toLowerCase();
        if (!tokensByChain.has(chain)) tokensByChain.set(chain, []);
        tokensByChain.get(chain)?.push(token.tokenAddress);
      });
    }
    
    // STRICTLY filter by chain if specified
    let tokensToFetch: string[] = [];
    if (chainId) {
      const normalizedChain = chainId.toLowerCase();
      tokensToFetch = tokensByChain.get(normalizedChain) || [];
    } else {
      tokensToFetch = Array.from(allTokenAddresses).slice(0, 60);
    }
    
    // Remove duplicates and shuffle for variety
    tokensToFetch = [...new Set(tokensToFetch)];
    tokensToFetch = tokensToFetch.sort(() => Math.random() - 0.5).slice(0, 60);
    
    // Fetch pair data for each token
    const allPairs: DexPair[] = [];
    const seenPairAddresses = new Set<string>();
    
    for (const tokenAddress of tokensToFetch) {
      try {
        const response = await fetch(`${API_BASE}/tokens/${tokenAddress}`);
        
        if (!response.ok) continue;
        
        const data: DexScreenerResponse = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
          // Get the best pair for this token (highest liquidity)
          const bestPair = data.pairs
            .filter(pair => {
              // Skip if we already have this pair
              if (seenPairAddresses.has(pair.pairAddress)) return false;
              
              // STRICTLY match chain if specified
              const matchesChain = !chainId || pair.chainId.toLowerCase() === chainId.toLowerCase();
              if (chainId && !matchesChain) return false;
              
              const quoteSymbol = pair.quoteToken.symbol.toUpperCase();
              const hasGoodQuote = quoteSymbol === 'SOL' || 
                     quoteSymbol === 'USDC' || 
                     quoteSymbol === 'USDT' ||
                     quoteSymbol === 'ETH' ||
                     quoteSymbol === 'WETH' ||
                     quoteSymbol === 'BNB' ||
                     quoteSymbol === 'WBNB' ||
                     quoteSymbol === 'MATIC' ||
                     quoteSymbol === 'AVAX';
              
              return hasGoodQuote;
            })
            .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
          
          if (bestPair) {
            allPairs.push(bestPair);
            seenPairAddresses.add(bestPair.pairAddress);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch token ${tokenAddress}:`, error);
      }
      
      // Stop once we have enough tokens above $30k
      if (allPairs.length >= 50) break;
    }
    
    return allPairs;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    throw error;
  }
};

export const searchTokens = async (query: string): Promise<DexPair[]> => {
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Failed to search tokens');
    }

    const data: DexScreenerResponse = await response.json();
    return data.pairs.slice(0, 20);
  } catch (error) {
    console.error('Error searching tokens:', error);
    throw error;
  }
};

export const getDexScreenerUrl = (chainId: string, pairAddress: string): string => {
  return `https://dexscreener.com/${chainId}/${pairAddress}`;
};

/**
 * Fetch from multiple DexScreener endpoints and mix results
 * Filters by Solana chain and market cap 10k-50M (expanded for more variety)
 * Optimized to avoid rate limits - uses caching and limits calls
 */
export const fetchMixedDexTokens = async (): Promise<DexPair[]> => {
  const endpoints = [
    'https://api.dexscreener.com/token-profiles/latest/v1',
    'https://api.dexscreener.com/token-boosts/latest/v1',
    'https://api.dexscreener.com/token-boosts/top/v1'
  ];

  try {
    // Fetch from 3 endpoints (reduced from 5 to avoid rate limits)
    const responses = await Promise.allSettled(
      endpoints.map(url => 
        Promise.race([
          fetch(url).then(res => res.ok ? res.json() : null),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ])
      )
    );

    // Collect all token addresses
    const tokenAddresses = new Set<string>();
    
    responses.forEach((result) => {
      if (result.status === 'fulfilled' && result.value && Array.isArray(result.value)) {
        result.value.forEach((item: any) => {
          if (item.tokenAddress && item.chainId?.toLowerCase() === 'solana') {
            tokenAddresses.add(item.tokenAddress);
          }
        });
      }
    });

    console.log(`Collected ${tokenAddresses.size} unique Solana token addresses`);

    // FETCH UP TO 60 tokens for more variety (increased from 30)
    const tokenArray = Array.from(tokenAddresses).slice(0, 60);
    
    // Fetch pair data for each token with timeout
    const pairPromises = tokenArray.map(async (tokenAddress) => {
      try {
        const response = await Promise.race([
          fetch(`${API_BASE}/tokens/${tokenAddress}`),
          new Promise<Response>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]);
        
        if (!response.ok) return null;
        
        const data: DexScreenerResponse = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
          // Get best pair for this token - prioritize pairs with most accurate data
          const bestPair = data.pairs
            .filter(pair => {
              if (pair.chainId.toLowerCase() !== 'solana') return false;
              
              // Use FDV as primary source (more accurate for tokens)
              // EXPANDED RANGE: 10k-50M for more variety (was 30k-10M)
              const marketCap = pair.fdv || pair.marketCap || 0;
              if (marketCap < 10000 || marketCap > 50000000) return false;
              
              // Must have volume data (relaxed threshold for more tokens)
              if (!pair.volume?.h24 || pair.volume.h24 < 50) return false;
              
              const quoteSymbol = pair.quoteToken.symbol.toUpperCase();
              return quoteSymbol === 'SOL' || quoteSymbol === 'USDC' || quoteSymbol === 'USDT';
            })
            .sort((a, b) => {
              // Sort by liquidity first, then by volume for better accuracy
              const liquidityDiff = (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
              if (Math.abs(liquidityDiff) > 1000) return liquidityDiff;
              return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
            })[0];
          
          return bestPair || null;
        }
        return null;
      } catch (error) {
        return null;
      }
    });

    // Fetch all in parallel
    const results = await Promise.allSettled(pairPromises);
    
    const allPairs: DexPair[] = results
      .filter((r): r is PromiseFulfilledResult<DexPair> => 
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value);

    // Remove duplicates by pair address
    const uniquePairs = Array.from(
      new Map(allPairs.map(pair => [pair.pairAddress, pair])).values()
    );

    // Shuffle for variety using better randomization
    const shuffled = uniquePairs.sort(() => Math.random() - 0.5);
    
    console.log(`Fetched ${shuffled.length} Solana pairs in 10k-50M market cap range`);
    
    return shuffled;
  } catch (error) {
    console.error('Error fetching from DexScreener:', error);
    return [];
  }
};
