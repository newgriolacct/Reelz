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
 * Fetch trending tokens using DexScreener's boosted tokens endpoint
 * Shows tokens with the most active boosts across all chains
 * @param chainId - Optional chain filter (e.g., 'solana', 'bsc', 'ethereum')
 */
export const fetchTrendingTokens = async (chainId?: string): Promise<DexPair[]> => {
  try {
    // Step 1: Fetch top boosted tokens
    const boostResponse = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
    
    if (!boostResponse.ok) {
      throw new Error(`Failed to fetch boosted tokens: ${boostResponse.status}`);
    }
    
    const boostedTokens: BoostedToken[] = await boostResponse.json();
    
    // Filter by chain if specified
    const filteredTokens = chainId 
      ? boostedTokens.filter(token => token.chainId.toLowerCase() === chainId.toLowerCase())
      : boostedTokens;
    
    // Step 2: Fetch pair data for each boosted token
    const allPairs: DexPair[] = [];
    
    // Take top 30 boosted tokens to ensure we get at least 10 good pairs after filtering
    const topTokens = filteredTokens.slice(0, 30);
    
    for (const boostedToken of topTokens) {
      try {
        const response = await fetch(`${API_BASE}/tokens/${boostedToken.tokenAddress}`);
        
        if (!response.ok) continue;
        
        const data: DexScreenerResponse = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
          // Get the best pair for this token (highest liquidity)
          const bestPair = data.pairs
            .filter(pair => {
              const quoteSymbol = pair.quoteToken.symbol.toUpperCase();
              // Prefer pairs with major quote tokens
              return quoteSymbol === 'SOL' || 
                     quoteSymbol === 'USDC' || 
                     quoteSymbol === 'USDT' ||
                     quoteSymbol === 'ETH' ||
                     quoteSymbol === 'WETH' ||
                     quoteSymbol === 'BNB' ||
                     quoteSymbol === 'WBNB';
            })
            .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
          
          if (bestPair) {
            allPairs.push(bestPair);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch token ${boostedToken.tokenAddress}:`, error);
      }
      
      // Stop once we have enough pairs
      if (allPairs.length >= 10) break;
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
