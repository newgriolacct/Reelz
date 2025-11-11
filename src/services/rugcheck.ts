import { apiCache } from './apiCache';

const RUGCHECK_API = 'https://api.rugcheck.xyz/v1';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export interface RugcheckToken {
  mint: string;
  score: number; // 0-10000 (we'll normalize to 0-10)
  risks: Array<{
    name: string;
    description: string;
    level: 'info' | 'warn' | 'danger';
    score: number;
  }>;
  tokenMeta: {
    freezeAuthority: string | null;
    mintAuthority: string | null;
    updateAuthority: string | null;
  };
  markets: Array<{
    lp: {
      lpLockedPct: number;
    };
  }>;
  topHolders: Array<{
    pct: number;
  }>;
  creator: {
    percentOwned: number;
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
 * Fetch security data from Rugcheck API
 */
export const fetchRugcheckData = async (mintAddress: string): Promise<SecurityData | null> => {
  try {
    console.log(`[Rugcheck] Fetching data for: ${mintAddress}`);
    
    // Check cache first
    const cacheKey = `rugcheck:${mintAddress}`;
    const cached = apiCache.get<SecurityData>(cacheKey);
    if (cached) {
      console.log(`[Rugcheck] Using cached data for ${mintAddress}`);
      return cached;
    }

    const url = `${RUGCHECK_API}/tokens/${mintAddress}/report`;
    console.log(`[Rugcheck] Calling API: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`[Rugcheck] Response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[Rugcheck] No data found for ${mintAddress}`);
        // Cache null result to avoid repeated 404s
        apiCache.set(cacheKey, null as any, CACHE_DURATION);
        return null;
      }
      if (response.status === 429) {
        console.log(`[Rugcheck] Rate limited for ${mintAddress} - will retry later`);
        return null; // Don't cache rate limit errors
      }
      throw new Error(`Rugcheck API error: ${response.status}`);
    }

    const data: RugcheckToken = await response.json();
    console.log(`[Rugcheck] Raw data:`, data);
    
    // Normalize score from 0-10000 to 0-10
    const normalizedScore = data.score / 1000;
    
    // Determine risk level
    let riskLevel: 'GOOD' | 'MEDIUM' | 'HIGH';
    if (normalizedScore >= 7) riskLevel = 'GOOD';
    else if (normalizedScore >= 4) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';
    
    // Calculate top holders percentage (top 10)
    const topHoldersPercent = data.topHolders
      ?.slice(0, 10)
      .reduce((sum, holder) => sum + holder.pct, 0) || 0;
    
    // Extract risk factors (only warn/danger)
    const riskFactors = data.risks
      ?.filter(risk => risk.level === 'warn' || risk.level === 'danger')
      .map(risk => risk.description) || [];
    
    const securityData: SecurityData = {
      score: normalizedScore,
      riskLevel,
      topHoldersPercent,
      freezeAuthority: data.tokenMeta.freezeAuthority !== null,
      mintAuthority: data.tokenMeta.mintAuthority !== null,
      lpLockedPercent: data.markets?.[0]?.lp?.lpLockedPct || 0,
      creatorPercent: data.creator?.percentOwned || 0,
      riskFactors,
    };
    
    console.log(`[Rugcheck] Processed data:`, securityData);
    
    // Cache the result
    apiCache.set(cacheKey, securityData, CACHE_DURATION);
    
    return securityData;
  } catch (error) {
    console.error(`[Rugcheck] Error fetching data for ${mintAddress}:`, error);
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
