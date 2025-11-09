import { Token } from "@/types/token";
import { BirdeyeToken, fetchBirdeyeTrending } from "./birdeye";

/**
 * Convert Birdeye token to our Token type
 */
const convertBirdeyeToToken = (token: BirdeyeToken, chainId: string): Token => {
  const priceChange = token.price24hChangePercent || token.volume24hChangePercent || 0;
  
  // Generate sparkline data from price change
  const points = 24;
  const sparklineData: number[] = [];
  let value = 100;
  
  for (let i = 0; i < points; i++) {
    const progress = i / points;
    const randomVariation = (Math.random() - 0.5) * 5;
    const trendChange = (priceChange / 100) * progress * 100;
    value = 100 + trendChange + randomVariation;
    sparklineData.push(Math.max(50, value));
  }

  return {
    id: token.address,
    symbol: token.symbol,
    name: token.name,
    avatarUrl: token.logoURI || `https://api.dicebear.com/7.x/shapes/svg?seed=${token.symbol}&backgroundColor=00d084`,
    price: token.price || 0,
    change24h: priceChange,
    marketCap: token.marketcap || 0,
    volume24h: token.volume24hUSD || 0,
    sparklineData,
    tags: [],
    isNew: false,
    liquidity: token.liquidity || 0,
    chain: chainId.charAt(0).toUpperCase() + chainId.slice(1),
    description: `Trading on ${chainId}. Market cap: $${(token.marketcap || 0).toLocaleString()}`,
    likes: Math.floor((token.volume24hUSD || 0) / 10000),
    comments: Math.floor((token.volume24hUSD || 0) / 50000),
    pairAddress: token.address,
    contractAddress: token.address,
    website: token.extensions?.website,
    twitter: token.extensions?.twitter,
    telegram: token.extensions?.telegram,
  };
};
/**
 * Mock data generator for fallback
 */
const generateMockToken = (index: number, chainId?: string): Token => {
  const chains = ['solana', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base'];
  const chain = chainId || chains[Math.floor(Math.random() * chains.length)];
  const symbols = ['PEPE', 'DOGE', 'SHIB', 'WIF', 'BONK', 'MEME', 'MOON', 'WOJAK', 'FLOKI', 'ELON'];
  const symbol = symbols[index % symbols.length] + (Math.floor(index / symbols.length) + 1);
  
  const priceChange = (Math.random() * 200) - 100;
  const points = 24;
  const sparklineData: number[] = [];
  let value = 100;
  
  for (let i = 0; i < points; i++) {
    const progress = i / points;
    const randomVariation = (Math.random() - 0.5) * 5;
    const trendChange = (priceChange / 100) * progress * 100;
    value = 100 + trendChange + randomVariation;
    sparklineData.push(Math.max(50, value));
  }
  
  return {
    id: `mock_${index}_${Date.now()}`,
    symbol: symbol,
    name: `${symbol} Token`,
    avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol}`,
    price: Math.random() * 0.1,
    change24h: priceChange,
    marketCap: Math.floor(Math.random() * 500000) + 50000,
    volume24h: Math.floor(Math.random() * 500000) + 50000,
    sparklineData,
    tags: [],
    isNew: false,
    liquidity: Math.floor(Math.random() * 100000) + 30000,
    chain: chain.charAt(0).toUpperCase() + chain.slice(1),
    description: `Mock token for ${chain}`,
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 50),
    pairAddress: `mock_${index}`,
    contractAddress: `token_${index}`,
  };
};

/**
 * Fetch trending tokens - Uses Birdeye API for all networks
 */
export const fetchAggregatedTrending = async (chainId?: string): Promise<Token[]> => {
  try {
    const network = chainId || 'solana';
    console.log(`Fetching real ${network} trending tokens...`);
    const tokens = await fetchBirdeyeTrending(network);
    return tokens.map(token => convertBirdeyeToToken(token, network));
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    // Fallback to mock data on error
    const tokens: Token[] = [];
    for (let i = 0; i < 10; i++) {
      tokens.push(generateMockToken(i, chainId));
    }
    return tokens;
  }
};

/**
 * Fetch random tokens for scrolling - Uses mock data
 */
export const fetchAggregatedRandom = async (chainId?: string): Promise<Token[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate 30 random tokens each time
  const tokens: Token[] = [];
  const startIndex = Math.floor(Math.random() * 1000);
  
  for (let i = 0; i < 30; i++) {
    tokens.push(generateMockToken(startIndex + i, chainId));
  }
  
  console.log(`Generated ${tokens.length} mock tokens for ${chainId || 'all chains'}`);
  
  return tokens;
};
