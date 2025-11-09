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
    console.log(`Fetching real ${network} trending tokens (100k-5M cap)...`);
    // Get trending tokens with 100k-5M market cap range (max 20 per Birdeye API limit)
    const tokens = await fetchBirdeyeTrending(network, 0, 20, 100000, 5000000);
    
    if (tokens.length === 0) {
      console.warn('No tokens from API, using mock data');
      throw new Error('No tokens returned');
    }
    
    // Randomly select 5 tokens from the filtered results
    const shuffled = tokens.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    return selected.map(token => convertBirdeyeToToken(token, network));
  } catch (error) {
    console.error('Error fetching trending tokens, using mock data:', error);
    // Fallback to mock data on error
    const tokens: Token[] = [];
    for (let i = 0; i < 5; i++) {
      const mockToken = generateMockToken(i, chainId);
      // Override market cap to be in range
      mockToken.marketCap = Math.floor(Math.random() * 4900000) + 100000;
      tokens.push(mockToken);
    }
    return tokens;
  }
};

/**
 * Fetch random tokens for scrolling - Uses real Birdeye data with market cap filter
 */
let tokenOffset = 0;
export const fetchAggregatedRandom = async (chainId?: string, reset: boolean = false): Promise<Token[]> => {
  try {
    const network = chainId || 'solana';
    
    // Reset offset when switching networks
    if (reset) {
      tokenOffset = 0;
    }
    
    console.log(`Fetching real ${network} tokens (offset: ${tokenOffset}, mcRange: 50k-10M)...`);
    // Filter by market cap: 50k to 10M (max 20 per Birdeye API limit)
    const tokens = await fetchBirdeyeTrending(network, tokenOffset, 20, 50000, 10000000);
    
    if (tokens.length === 0) {
      console.warn('No tokens from API, using mock data');
      throw new Error('No tokens returned');
    }
    
    // Increment offset for next call
    tokenOffset += 20;
    
    return tokens.map(token => convertBirdeyeToToken(token, network));
  } catch (error) {
    console.error('Error fetching tokens, using mock data:', error);
    // Fallback to mock data on error
    const tokens: Token[] = [];
    for (let i = 0; i < 20; i++) {
      const mockToken = generateMockToken(tokenOffset + i, chainId);
      // Override market cap to be in range
      mockToken.marketCap = Math.floor(Math.random() * 9950000) + 50000;
      tokens.push(mockToken);
    }
    tokenOffset += 20;
    return tokens;
  }
};
