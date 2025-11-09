import { DexPair } from './dexscreener';

const API_BASE = 'https://api.geckoterminal.com/api/v2';

interface GeckoPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    pool_created_at: string;
    reserve_in_usd: string;
    fdv_usd?: string;
    market_cap_usd?: string | null;
    price_change_percentage: {
      h24: string;
    };
    transactions: {
      h24: {
        buys: number;
        sells: number;
      };
    };
    volume_usd: {
      h24: string;
    };
  };
  relationships: {
    base_token: {
      data: {
        id: string;
        type: string;
      };
    };
    quote_token: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface GeckoToken {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    image_url: string;
  };
}

interface GeckoResponse {
  data: GeckoPool[];
  included?: GeckoToken[];
}

const CHAIN_MAPPING: { [key: string]: string } = {
  'solana': 'solana',
  'ethereum': 'eth',
  'bsc': 'bsc',
  'polygon': 'polygon_pos',
  'base': 'base',
};

/**
 * Convert GeckoTerminal pool to DexPair format
 */
const convertGeckoPoolToDexPair = (
  pool: GeckoPool,
  tokens: GeckoToken[],
  chainId: string
): DexPair | null => {
  try {
    // Try to find tokens in included array first
    let baseTokenData = tokens.find(t => t.id === pool.relationships.base_token.data.id);
    let quoteTokenData = tokens.find(t => t.id === pool.relationships.quote_token.data.id);
    
    // If tokens not in included array, extract from pool name
    if (!baseTokenData || !quoteTokenData) {
      const nameParts = pool.attributes.name.split(' / ');
      if (nameParts.length >= 2) {
        const baseSymbol = nameParts[0].trim();
        const quoteSymbol = nameParts[1].split(' ')[0].trim();
        
        baseTokenData = {
          id: pool.relationships.base_token.data.id,
          type: 'token',
          attributes: {
            address: pool.relationships.base_token.data.id.split('_').pop() || '',
            name: baseSymbol,
            symbol: baseSymbol,
            image_url: '',
          }
        };
        
        quoteTokenData = {
          id: pool.relationships.quote_token.data.id,
          type: 'token',
          attributes: {
            address: pool.relationships.quote_token.data.id.split('_').pop() || '',
            name: quoteSymbol,
            symbol: quoteSymbol,
            image_url: '',
          }
        };
      } else {
        return null;
      }
    }
    
    const fdv = parseFloat(pool.attributes.fdv_usd || '0');
    const marketCap = pool.attributes.market_cap_usd 
      ? parseFloat(pool.attributes.market_cap_usd) 
      : fdv;
    
    return {
      chainId: chainId,
      dexId: 'geckoterminal',
      url: `https://dexscreener.com/${chainId}/${pool.attributes.address}`,
      pairAddress: pool.attributes.address,
      baseToken: {
        address: baseTokenData.attributes.address,
        name: baseTokenData.attributes.name,
        symbol: baseTokenData.attributes.symbol,
      },
      quoteToken: {
        address: quoteTokenData.attributes.address,
        name: quoteTokenData.attributes.name,
        symbol: quoteTokenData.attributes.symbol,
      },
      priceNative: '0',
      priceUsd: pool.attributes.base_token_price_usd || '0',
      txns: {
        h24: {
          buys: pool.attributes.transactions?.h24?.buys || 0,
          sells: pool.attributes.transactions?.h24?.sells || 0,
        },
      },
      volume: {
        h24: parseFloat(pool.attributes.volume_usd?.h24 || '0'),
      },
      priceChange: {
        h24: parseFloat(pool.attributes.price_change_percentage?.h24 || '0'),
      },
      liquidity: {
        usd: parseFloat(pool.attributes.reserve_in_usd || '0'),
        base: 0,
        quote: 0,
      },
      fdv: fdv,
      marketCap: marketCap,
      pairCreatedAt: new Date(pool.attributes.pool_created_at).getTime(),
      info: {
        imageUrl: baseTokenData.attributes.image_url,
      },
    };
  } catch (error) {
    return null;
  }
};

/**
 * Fetch trending pools from GeckoTerminal
 */
export const fetchGeckoTrendingPools = async (chainId?: string): Promise<DexPair[]> => {
  try {
    const pairs: DexPair[] = [];
    const chains = chainId ? [chainId] : Object.keys(CHAIN_MAPPING);
    
    for (const chain of chains) {
      const geckoChain = CHAIN_MAPPING[chain];
      if (!geckoChain) continue;
      
        try {
          const url = `${API_BASE}/networks/${geckoChain}/trending_pools?page=1`;
          const response = await fetch(url, { 
            headers: { 'Accept': 'application/json' }
          });
          
          if (!response.ok) continue;
        
        const data: GeckoResponse = await response.json();
        
        if (data.data) {
          for (const pool of data.data.slice(0, 10)) { // Reduced to 10 for speed
            const pair = convertGeckoPoolToDexPair(pool, data.included || [], chain);
            if (pair) pairs.push(pair);
          }
        }
      } catch (error) {
        // Silently continue on timeout or error
        continue;
      }
      
      // If we have enough pairs for a specific chain, stop early
      if (chainId && pairs.length >= 5) break;
    }
    
    return pairs;
  } catch (error) {
    console.error('Error in fetchGeckoTrendingPools:', error);
    return [];
  }
};

/**
 * Fetch new pools from GeckoTerminal
 */
export const fetchGeckoNewPools = async (chainId?: string): Promise<DexPair[]> => {
  try {
    const pairs: DexPair[] = [];
    const chains = chainId ? [chainId] : Object.keys(CHAIN_MAPPING);
    
    for (const chain of chains) {
      const geckoChain = CHAIN_MAPPING[chain];
      if (!geckoChain) continue;
      
        try {
          const url = `${API_BASE}/networks/${geckoChain}/new_pools?page=1`;
          const response = await fetch(url, { 
            headers: { 'Accept': 'application/json' }
          });
          
          if (!response.ok) continue;
        
        const data: GeckoResponse = await response.json();
        
        if (data.data) {
          for (const pool of data.data.slice(0, 20)) { // Reduced to 20 for speed
            const pair = convertGeckoPoolToDexPair(pool, data.included || [], chain);
            if (pair) pairs.push(pair);
          }
        }
      } catch (error) {
        // Silently continue on timeout or error
        continue;
      }
    }
    
    return pairs;
  } catch (error) {
    console.error('Error fetching GeckoTerminal new pools:', error);
    return [];
  }
};
