export interface BirdeyeToken {
  address: string;
  decimals: number;
  liquidity: number;
  logoURI?: string;
  marketcap: number;
  name: string;
  symbol: string;
  volume24hUSD: number;
  volume24hChangePercent: number;
  price24hChangePercent?: number;
  price?: number;
  extensions?: {
    website?: string;
    twitter?: string;
    telegram?: string;
  };
}

export interface BirdeyeResponse {
  success?: boolean;
  data: {
    tokens: BirdeyeToken[];
    updateUnixTime: number;
    updateTime: string;
  };
}

const CHAIN_MAP: Record<string, string> = {
  'solana': 'solana',
  'ethereum': 'ethereum',
  'bsc': 'bsc',
  'polygon': 'polygon',
  'arbitrum': 'arbitrum',
  'base': 'base',
  'avalanche': 'avalanche',
  'optimism': 'optimism',
  'zksync': 'zksync',
  'sui': 'sui',
};

/**
 * Fetch trending tokens from Birdeye API via backend
 */
export const fetchBirdeyeTrending = async (
  network: string, 
  offset: number = 0, 
  limit: number = 20,
  minMc: number = 50000,
  maxMc: number = 10000000
): Promise<BirdeyeToken[]> => {
  try {
    const chain = CHAIN_MAP[network.toLowerCase()] || 'solana';
    const backendUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-tokens?chain=${chain}&offset=${offset}&limit=${limit}&minMc=${minMc}&maxMc=${maxMc}`;
    
    console.log(`Fetching ${chain} tokens via Birdeye (offset: ${offset}, mcRange: ${minMc}-${maxMc})...`);
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data: BirdeyeResponse = await response.json();
    
    if (!data.data?.tokens) {
      console.warn('No data received from Birdeye');
      return [];
    }
    
    console.log(`Received ${data.data.tokens.length} ${chain} tokens`);
    return data.data.tokens;
  } catch (error) {
    console.error('Error fetching Birdeye trending tokens:', error);
    throw error;
  }
};
