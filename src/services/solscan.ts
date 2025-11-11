import { apiCache } from './apiCache';

const CACHE_DURATION = 30 * 1000; // 30 seconds cache for real-time feel
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=c6afc762-dee9-4263-b82f-b7d2c94f8f2c';

interface DexTransaction {
  type: 'buy' | 'sell';
  priceUsd: number;
  amount: number;
  totalUsd: number;
  timestamp: number;
  txHash: string;
  maker: string;
}

interface TokenHolder {
  address: string;
  amount: number;
  percentage: number;
}

/**
 * Fetch recent transactions using Helius RPC from DEX pair address
 */
export const fetchTokenTransactions = async (pairAddress: string): Promise<DexTransaction[]> => {
  try {
    const cacheKey = `helius:txs:${pairAddress}`;
    const cached = apiCache.get<DexTransaction[]>(cacheKey);
    if (cached) return cached;

    console.log(`[Helius] Fetching transactions for pair: ${pairAddress}`);

    // Fetch recent transactions for the pair address (where swaps occur)
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'tx-history',
        method: 'getSignaturesForAddress',
        params: [
          pairAddress,
          { limit: 30 }
        ]
      })
    });

    if (!response.ok) {
      console.error(`[Helius] Transaction fetch error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const signatures = data.result || [];
    
    if (signatures.length === 0) {
      console.log(`[Helius] No transactions found for ${pairAddress}`);
      return [];
    }

    console.log(`[Helius] Found ${signatures.length} signatures`);

    // Fetch detailed transaction data for first 20
    const txPromises = signatures.slice(0, 20).map(async (sig: any) => {
      try {
        const txResponse = await fetch(HELIUS_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'tx-detail',
            method: 'getTransaction',
            params: [
              sig.signature,
              {
                encoding: 'jsonParsed',
                maxSupportedTransactionVersion: 0
              }
            ]
          })
        });

        const txData = await txResponse.json();
        return txData.result;
      } catch (err) {
        console.error('[Helius] Error fetching tx detail:', err);
        return null;
      }
    });

    const txDetails = await Promise.all(txPromises);
    const transactions: DexTransaction[] = [];

    for (const tx of txDetails) {
      if (!tx || !tx.meta || tx.meta.err) continue;

      // Parse transaction to determine buy/sell and amounts
      const preBalances = tx.meta.preTokenBalances || [];
      const postBalances = tx.meta.postTokenBalances || [];
      
      // Look for token balance changes to identify swaps
      for (let i = 0; i < postBalances.length; i++) {
        const postBalance = postBalances[i];
        const preBalance = preBalances.find((pb: any) => pb.accountIndex === postBalance.accountIndex);
        
        if (!preBalance) continue;

        const preAmount = parseFloat(preBalance.uiTokenAmount?.uiAmountString || '0');
        const postAmount = parseFloat(postBalance.uiTokenAmount?.uiAmountString || '0');
        const change = postAmount - preAmount;

        if (Math.abs(change) > 0.001) { // Ignore dust amounts
          const type = change > 0 ? 'buy' : 'sell';
          const amount = Math.abs(change);
          
          // Calculate USD value from SOL balance change
          const preSOL = tx.meta.preBalances[0] / 1e9;
          const postSOL = tx.meta.postBalances[0] / 1e9;
          const solChange = Math.abs(postSOL - preSOL);
          
          // Get current SOL price (approximate)
          const solPrice = 150; // You could fetch this from an API for accuracy
          const totalUsd = solChange * solPrice;
          
          // Only include transactions with meaningful USD value
          if (totalUsd > 0.01) {
            transactions.push({
              type,
              priceUsd: totalUsd / amount,
              amount,
              totalUsd,
              timestamp: (tx.blockTime || 0) * 1000,
              txHash: tx.transaction.signatures[0],
              maker: tx.transaction.message.accountKeys[0]?.pubkey || 'Unknown',
            });
          }
          break; // Only process first significant balance change
        }
      }
    }

    console.log(`[Helius] Processed ${transactions.length} valid transactions`);

    // Sort by timestamp descending
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    apiCache.set(cacheKey, transactions, CACHE_DURATION);
    return transactions;
  } catch (error) {
    console.error('[Helius] Error fetching transactions:', error);
    return [];
  }
};

/**
 * Fetch top token holders using Helius API
 */
export const fetchTokenHolders = async (tokenAddress: string): Promise<TokenHolder[]> => {
  try {
    const cacheKey = `helius:holders:${tokenAddress}`;
    const cached = apiCache.get<TokenHolder[]>(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=c6afc762-dee9-4263-b82f-b7d2c94f8f2c`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'holder-list',
          method: 'getTokenLargestAccounts',
          params: [tokenAddress]
        })
      }
    );

    if (!response.ok) {
      console.error(`[Helius] Holder fetch error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const accounts = data.result?.value || [];

    // Get total supply to calculate percentages
    const supplyResponse = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=c6afc762-dee9-4263-b82f-b7d2c94f8f2c`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'supply',
          method: 'getTokenSupply',
          params: [tokenAddress]
        })
      }
    );

    const supplyData = await supplyResponse.json();
    const totalSupply = parseFloat(supplyData.result?.value?.uiAmountString || '1');

    const holders: TokenHolder[] = accounts
      .slice(0, 10)
      .map((account: any) => ({
        address: account.address,
        amount: parseFloat(account.uiAmountString || '0'),
        percentage: (parseFloat(account.uiAmountString || '0') / totalSupply) * 100
      }))
      .filter((h: TokenHolder) => h.amount > 0);

    apiCache.set(cacheKey, holders, CACHE_DURATION);
    return holders;
  } catch (error) {
    console.error('[Helius] Error fetching holders:', error);
    return [];
  }
};
