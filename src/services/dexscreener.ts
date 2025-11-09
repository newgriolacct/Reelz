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
    // Fetch some popular tokens from different chains
    const popularAddresses = [
      'So11111111111111111111111111111111111111112', // Solana SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
      '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4', // JTO
    ];

    const response = await fetch(
      `${API_BASE}/tokens/${popularAddresses.join(',')}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch tokens from DexScreener');
    }

    const data: DexScreenerResponse = await response.json();
    
    // Return top 10 pairs sorted by liquidity
    return data.pairs
      .filter(pair => pair.liquidity.usd > 10000)
      .sort((a, b) => b.liquidity.usd - a.liquidity.usd)
      .slice(0, 10);
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
