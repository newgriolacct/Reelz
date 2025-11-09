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
 * Fetch trending Solana tokens using the trending endpoint
 * Returns real-time trending tokens on Solana
 */
export const fetchSolanaTrending = async (): Promise<DexPair[]> => {
  try {
    const response = await fetch('https://api.dexscreener.com/latest/dex/trending/solana');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Solana trending tokens: ${response.status}`);
    }
    
    const data: DexScreenerResponse = await response.json();
    
    // Return the trending pairs, limiting to 20 for performance
    return data.pairs.slice(0, 20);
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
