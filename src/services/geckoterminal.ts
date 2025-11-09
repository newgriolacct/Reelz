// GeckoTerminal API service for fetching trending tokens across multiple chains
// No API key required, free to use

export interface GeckoTerminalToken {
  id: string;
  type: string;
  attributes: {
    name: string;
    symbol: string;
    address: string;
    image_url: string;
    coingecko_coin_id: string | null;
  };
}

export interface GeckoTerminalPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    pool_created_at: string;
    reserve_in_usd: string;
    fdv_usd: string;
    market_cap_usd: string | null;
    price_change_percentage: {
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      h1: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
      h24: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
    };
    volume_usd: {
      h1: string;
      h6: string;
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
    dex: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

export interface GeckoTerminalResponse {
  data: GeckoTerminalPool[];
  included: (GeckoTerminalToken | any)[];
}

const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';

/**
 * Fetch trending pools across all networks
 * Returns the most popular trading pools in the last 24 hours
 */
export const fetchTrendingPools = async (): Promise<GeckoTerminalResponse> => {
  try {
    const response = await fetch(`${GECKOTERMINAL_API}/networks/trending_pools`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trending pools from GeckoTerminal:', error);
    throw error;
  }
};

/**
 * Fetch trending pools for a specific network
 * @param network - Network ID (e.g., 'eth', 'bsc', 'solana', 'polygon', 'arbitrum')
 */
export const fetchNetworkTrendingPools = async (network: string): Promise<GeckoTerminalResponse> => {
  try {
    const response = await fetch(
      `${GECKOTERMINAL_API}/networks/${network}/trending_pools`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching trending pools for ${network}:`, error);
    throw error;
  }
};

/**
 * Get the chart URL for a token on GeckoTerminal
 */
export const getGeckoTerminalChartUrl = (network: string, poolAddress: string): string => {
  return `https://www.geckoterminal.com/${network}/pools/${poolAddress}`;
};
