import { apiCache } from './apiCache';

const CACHE_DURATION = 60 * 1000; // 1 minute cache

interface SolscanTransaction {
  txHash: string;
  blockTime: number;
  slot: number;
  status: string;
  fee: number;
  lamport: number;
  signer: string[];
}

interface SolscanHolder {
  address: string;
  amount: number;
  decimals: number;
  owner: string;
  rank: number;
}

/**
 * Fetch recent transactions for a token from Solscan
 */
export const fetchTokenTransactions = async (tokenAddress: string, limit = 20): Promise<SolscanTransaction[]> => {
  try {
    const cacheKey = `solscan:txs:${tokenAddress}`;
    const cached = apiCache.get<SolscanTransaction[]>(cacheKey);
    if (cached) return cached;

    // Solscan public API endpoint
    const response = await fetch(
      `https://public-api.solscan.io/token/transfer/latest?address=${tokenAddress}&limit=${limit}`
    );

    if (!response.ok) {
      console.error(`[Solscan] Transaction fetch error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const transactions = data.data || [];
    
    apiCache.set(cacheKey, transactions, CACHE_DURATION);
    return transactions;
  } catch (error) {
    console.error('[Solscan] Error fetching transactions:', error);
    return [];
  }
};

/**
 * Fetch top holders for a token from Solscan
 */
export const fetchTokenHolders = async (tokenAddress: string, limit = 20): Promise<SolscanHolder[]> => {
  try {
    const cacheKey = `solscan:holders:${tokenAddress}`;
    const cached = apiCache.get<SolscanHolder[]>(cacheKey);
    if (cached) return cached;

    // Solscan public API endpoint
    const response = await fetch(
      `https://public-api.solscan.io/token/holders?address=${tokenAddress}&offset=0&limit=${limit}`
    );

    if (!response.ok) {
      console.error(`[Solscan] Holders fetch error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const holders = data.data || [];
    
    apiCache.set(cacheKey, holders, CACHE_DURATION);
    return holders;
  } catch (error) {
    console.error('[Solscan] Error fetching holders:', error);
    return [];
  }
};
