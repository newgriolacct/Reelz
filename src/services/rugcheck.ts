import { apiCache } from './apiCache';

const GOPLUS_API = 'https://api.gopluslabs.io/api/v1/token_security';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (security data doesn't change often)

export interface GoPlusTokenSecurity {
  is_open_source: string;
  is_proxy: string;
  is_mintable: string;
  can_take_back_ownership: string;
  owner_change_balance: string;
  hidden_owner: string;
  selfdestruct: string;
  external_call: string;
  buy_tax: string;
  sell_tax: string;
  is_honeypot: string;
  transfer_pausable: string;
  is_blacklisted: string;
  is_whitelisted: string;
  is_anti_whale: string;
  trading_cooldown: string;
  is_in_dex: string;
  holder_count: string;
  owner_address: string;
  creator_address: string;
  lp_holder_count: string;
  lp_total_supply: string;
  total_supply: string;
  holders: Array<{
    address: string;
    balance: string;
    percent: number;
    is_contract: number;
    is_locked: number;
  }>;
  trust_list: string;
}

export interface GoPlusResponse {
  code: number;
  message: string;
  result: {
    [address: string]: GoPlusTokenSecurity;
  };
}

export interface SecurityData {
  score: number; // Normalized 0-10
  riskLevel: 'GOOD' | 'MEDIUM' | 'HIGH';
  topHoldersPercent: number;
  freezeAuthority: boolean;
  mintAuthority: boolean;
  lpLockedPercent: number;
  creatorPercent: number;
  riskFactors: string[];
}

/**
 * Fetch security data from GoPlus Security API
 */
export const fetchRugcheckData = async (mintAddress: string): Promise<SecurityData | null> => {
  try {
    console.log(`[GoPlus] Fetching security data for: ${mintAddress}`);
    
    // Check cache first
    const cacheKey = `security:${mintAddress}`;
    const cached = apiCache.get<SecurityData>(cacheKey);
    if (cached) {
      console.log(`[GoPlus] Using cached data for ${mintAddress}`);
      return cached;
    }

    // GoPlus API endpoint for Solana
    const url = `${GOPLUS_API}/solana?contract_addresses=${mintAddress}`;
    console.log(`[GoPlus] Calling API: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`[GoPlus] Response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[GoPlus] No data found for ${mintAddress}`);
        apiCache.set(cacheKey, null as any, CACHE_DURATION);
        return null;
      }
      throw new Error(`GoPlus API error: ${response.status}`);
    }

    const data: GoPlusResponse = await response.json();
    console.log(`[GoPlus] Raw data:`, data);
    
    if (!data.result || !data.result[mintAddress.toLowerCase()]) {
      console.log(`[GoPlus] Token not yet indexed by GoPlus - returning basic security data`);
      
      // Return basic security data for unindexed tokens
      const basicData: SecurityData = {
        score: 5, // Neutral score
        riskLevel: 'MEDIUM',
        topHoldersPercent: 0,
        freezeAuthority: false,
        mintAuthority: false,
        lpLockedPercent: 0,
        creatorPercent: 0,
        riskFactors: ['Security data not yet available - token may be too new'],
      };
      
      // Cache for shorter time since it might get indexed soon
      apiCache.set(cacheKey, basicData, 5 * 60 * 1000); // 5 minutes
      
      return basicData;
    }
    
    const tokenData = data.result[mintAddress.toLowerCase()];
    
    // Calculate risk score based on various factors (0-10 scale)
    let score = 10;
    const riskFactors: string[] = [];
    
    // Mintable (very high risk)
    if (tokenData.is_mintable === '1') {
      score -= 3;
      riskFactors.push('Token can be minted (supply can increase)');
    }
    
    // Honeypot (critical risk)
    if (tokenData.is_honeypot === '1') {
      score -= 4;
      riskFactors.push('Potential honeypot detected');
    }
    
    // Transfer pausable
    if (tokenData.transfer_pausable === '1') {
      score -= 2;
      riskFactors.push('Transfers can be paused by owner');
    }
    
    // Hidden owner
    if (tokenData.hidden_owner === '1') {
      score -= 1.5;
      riskFactors.push('Hidden owner detected');
    }
    
    // Owner can change balance
    if (tokenData.owner_change_balance === '1') {
      score -= 2;
      riskFactors.push('Owner can modify balances');
    }
    
    // High taxes
    const buyTax = parseFloat(tokenData.buy_tax || '0');
    const sellTax = parseFloat(tokenData.sell_tax || '0');
    if (buyTax > 10 || sellTax > 10) {
      score -= 1;
      riskFactors.push(`High transaction fees (Buy: ${buyTax}%, Sell: ${sellTax}%)`);
    }
    
    // Anti-whale or trading cooldown (moderate concern)
    if (tokenData.is_anti_whale === '1' || tokenData.trading_cooldown === '1') {
      score -= 0.5;
      riskFactors.push('Trading restrictions in place');
    }
    
    // Calculate top holders percentage
    const topHoldersPercent = tokenData.holders
      ?.slice(0, 10)
      .reduce((sum, holder) => sum + holder.percent, 0) || 0;
    
    if (topHoldersPercent > 50) {
      score -= 1;
      riskFactors.push('High holder concentration');
    }
    
    // Normalize score to 0-10
    score = Math.max(0, Math.min(10, score));
    
    // Determine risk level
    let riskLevel: 'GOOD' | 'MEDIUM' | 'HIGH';
    if (score >= 7) riskLevel = 'GOOD';
    else if (score >= 4) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';
    
    const securityData: SecurityData = {
      score,
      riskLevel,
      topHoldersPercent,
      freezeAuthority: tokenData.transfer_pausable === '1',
      mintAuthority: tokenData.is_mintable === '1',
      lpLockedPercent: 0, // GoPlus doesn't provide LP lock percentage directly
      creatorPercent: 0, // Calculate from holders if creator address is available
      riskFactors,
    };
    
    // Find creator percentage from holders
    if (tokenData.creator_address && tokenData.holders) {
      const creatorHolder = tokenData.holders.find(
        h => h.address.toLowerCase() === tokenData.creator_address.toLowerCase()
      );
      if (creatorHolder) {
        securityData.creatorPercent = creatorHolder.percent;
      }
    }
    
    console.log(`[GoPlus] Processed data:`, securityData);
    
    // Cache the result
    apiCache.set(cacheKey, securityData, CACHE_DURATION);
    
    return securityData;
  } catch (error) {
    console.error(`[GoPlus] Error fetching data for ${mintAddress}:`, error);
    return null;
  }
};

/**
 * Batch fetch security data for multiple tokens
 * Fetches sequentially with small delays to avoid rate limits
 */
export const fetchBatchRugcheckData = async (
  mintAddresses: string[]
): Promise<Map<string, SecurityData>> => {
  const results = new Map<string, SecurityData>();
  
  for (const address of mintAddresses) {
    try {
      const data = await fetchRugcheckData(address);
      if (data) {
        results.set(address, data);
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to fetch security for ${address}:`, error);
    }
  }
  
  return results;
};
