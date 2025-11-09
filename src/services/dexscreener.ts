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
  liquidity: {
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

export const fetchTrendingTokens = async (): Promise<DexPair[]> => {
  try {
    // Fetch popular Solana tokens individually to get diverse pairs
    const tokens = [
      'So11111111111111111111111111111111111111112', // SOL
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // JitoSOL
      'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', // MEW
    ];

    const allPairs: DexPair[] = [];
    
    // Fetch each token separately to get diverse pairs
    for (const tokenAddress of tokens) {
      try {
        const response = await fetch(`${API_BASE}/tokens/${tokenAddress}`);
        if (response.ok) {
          const data: DexScreenerResponse = await response.json();
          // Get the pair with highest liquidity for this token
          const bestPair = data.pairs
            .filter(pair => 
              pair.liquidity.usd > 50000 && 
              pair.volume.h24 > 1000 &&
              // Prefer USDC/USDT pairs
              (pair.quoteToken.symbol === 'USDC' || 
               pair.quoteToken.symbol === 'USDT' ||
               pair.quoteToken.symbol === 'SOL')
            )
            .sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
          
          if (bestPair) {
            allPairs.push(bestPair);
          }
        }
      } catch (err) {
        console.error(`Error fetching token ${tokenAddress}:`, err);
      }
    }
    
    return allPairs.slice(0, 10);
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
