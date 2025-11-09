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
 * Fetch tokens from multiple DexScreener endpoints for diversity
 * Combines: top boosts, latest boosts, ads, and token profiles
 * @param chainId - Optional chain filter (e.g., 'solana', 'bsc', 'ethereum')
 */
export const fetchTrendingTokens = async (chainId?: string): Promise<DexPair[]> => {
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
    
    // Filter by chain if specified, otherwise get from all chains
    let tokensToFetch: string[] = [];
    if (chainId) {
      const normalizedChain = chainId.toLowerCase();
      tokensToFetch = tokensByChain.get(normalizedChain) || [];
      
      // If not enough tokens for this chain, add some from other chains
      if (tokensToFetch.length < 30) {
        const otherTokens = Array.from(allTokenAddresses)
          .filter(addr => !tokensToFetch.includes(addr))
          .slice(0, 30 - tokensToFetch.length);
        tokensToFetch = [...tokensToFetch, ...otherTokens];
      }
    } else {
      tokensToFetch = Array.from(allTokenAddresses).slice(0, 50);
    }
    
    // Remove duplicates and shuffle for variety
    tokensToFetch = [...new Set(tokensToFetch)];
    tokensToFetch = tokensToFetch.sort(() => Math.random() - 0.5).slice(0, 50);
    
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
              
              // Filter by chain if specified
              if (chainId && pair.chainId.toLowerCase() !== chainId.toLowerCase()) return false;
              
              const quoteSymbol = pair.quoteToken.symbol.toUpperCase();
              // Prefer pairs with major quote tokens
              return quoteSymbol === 'SOL' || 
                     quoteSymbol === 'USDC' || 
                     quoteSymbol === 'USDT' ||
                     quoteSymbol === 'ETH' ||
                     quoteSymbol === 'WETH' ||
                     quoteSymbol === 'BNB' ||
                     quoteSymbol === 'WBNB' ||
                     quoteSymbol === 'MATIC' ||
                     quoteSymbol === 'AVAX';
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
      
      // Stop once we have enough pairs
      if (allPairs.length >= 25) break;
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
