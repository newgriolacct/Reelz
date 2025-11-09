import { DexPair, fetchSolanaTrending } from './dexscreener';
import { Token, convertDexPairToToken } from '@/types/token';

// Mock data generator - NO API CALLS
const generateMockToken = (index: number, chainId?: string): DexPair => {
  const chains = ['solana', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base'];
  const chain = chainId || chains[Math.floor(Math.random() * chains.length)];
  const symbols = ['PEPE', 'DOGE', 'SHIB', 'WIF', 'BONK', 'MEME', 'MOON', 'WOJAK', 'FLOKI', 'ELON'];
  const symbol = symbols[index % symbols.length] + (Math.floor(index / symbols.length) + 1);
  
  return {
    chainId: chain,
    dexId: 'mock',
    url: `https://example.com/${symbol}`,
    pairAddress: `mock_${index}_${Date.now()}`,
    baseToken: {
      address: `token_${index}_${Date.now()}`,
      name: `${symbol} Token`,
      symbol: symbol,
    },
    quoteToken: {
      address: 'wrapped_native',
      name: 'Wrapped Native',
      symbol: 'WNATIVE',
    },
    priceNative: `${(Math.random() * 0.001).toFixed(9)}`,
    priceUsd: `${(Math.random() * 0.1).toFixed(6)}`,
    txns: {
      h24: { buys: Math.floor(Math.random() * 1000), sells: Math.floor(Math.random() * 1000) }
    },
    volume: {
      h24: Math.floor(Math.random() * 500000) + 50000,
    },
    priceChange: {
      h24: (Math.random() * 200) - 100,
    },
    liquidity: {
      usd: Math.floor(Math.random() * 100000) + 30000,
      base: Math.floor(Math.random() * 1000000),
      quote: Math.floor(Math.random() * 100),
    },
    fdv: Math.floor(Math.random() * 500000) + 50000,
    marketCap: Math.floor(Math.random() * 500000) + 50000,
    pairCreatedAt: Date.now() - Math.floor(Math.random() * 86400000),
    info: {
      imageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol}`,
    },
  };
};

/**
 * Fetch trending tokens - Uses real API for Solana, mock for others
 */
export const fetchAggregatedTrending = async (chainId?: string): Promise<Token[]> => {
  try {
    // Use real API for Solana
    if (chainId?.toLowerCase() === 'solana') {
      console.log('Fetching real Solana trending tokens...');
      const pairs = await fetchSolanaTrending();
      console.log(`Received ${pairs.length} Solana trending tokens`);
      return pairs.map(convertDexPairToToken);
    }
    
    // For other networks, return mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    const tokens: DexPair[] = [];
    for (let i = 0; i < 10; i++) {
      tokens.push(generateMockToken(i, chainId));
    }
    return tokens.map(convertDexPairToToken);
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    // Fallback to mock data on error
    const tokens: DexPair[] = [];
    for (let i = 0; i < 10; i++) {
      tokens.push(generateMockToken(i, chainId));
    }
    return tokens.map(convertDexPairToToken);
  }
};

/**
 * Return mock random tokens for scrolling - NO API CALLS
 */
export const fetchAggregatedRandom = async (chainId?: string): Promise<Token[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate 30 random tokens each time
  const tokens: DexPair[] = [];
  const startIndex = Math.floor(Math.random() * 1000);
  
  for (let i = 0; i < 30; i++) {
    tokens.push(generateMockToken(startIndex + i, chainId));
  }
  
  console.log(`Generated ${tokens.length} mock tokens for ${chainId || 'all chains'}`);
  
  return tokens.map(convertDexPairToToken);
};
