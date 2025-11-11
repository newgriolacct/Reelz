import { apiCache } from './apiCache';

const RUGCHECK_API = 'https://api.rugcheck.xyz/v1/tokens';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface RugcheckResponse {
  mint: string;
  score: number;
  risks: Array<{
    name: string;
    description: string;
    level: string;
    score: number;
  }>;
  topHolders: Array<{
    address: string;
    pct: number;
  }>;
  freezeAuthority: string | null;
  mintAuthority: string | null;
  markets?: Array<{
    lp?: {
      lpLockedPct?: number;
    };
  }>;
  creator?: {
    address?: string;
    pct?: number;
  };
  token?: {
    createAt?: string;
  };
}

export interface SecurityData {
  score: number; // Normalized 0-10
  riskLevel: 'GOOD' | 'MEDIUM' | 'HIGH';
  topHoldersPercent: number;
  freezeAuthority: boolean;
  mintAuthority: boolean;
  creatorPercent: number;
  tokenAge: string | null;
}

/**
 * Fetch security data from Rugcheck API
 */
export const fetchRugcheckData = async (mintAddress: string): Promise<SecurityData | null> => {
  try {
    console.log(`[Rugcheck] Fetching security data for: ${mintAddress}`);
    
    // Check cache first
    const cacheKey = `security:${mintAddress}`;
    const cached = apiCache.get<SecurityData>(cacheKey);
    if (cached) {
      console.log(`[Rugcheck] Using cached data for ${mintAddress}`);
      return cached;
    }

    const url = `${RUGCHECK_API}/${mintAddress}/report`;
    console.log(`[Rugcheck] Calling API: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`[Rugcheck] Response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[Rugcheck] No data found for ${mintAddress}`);
        return null;
      }
      throw new Error(`Rugcheck API error: ${response.status}`);
    }

    const data: RugcheckResponse = await response.json();
    console.log(`[Rugcheck] Raw data:`, data);
    
    // Calculate top holders percentage
    const topHoldersPercent = data.topHolders
      ?.slice(0, 10)
      .reduce((sum, holder) => sum + holder.pct, 0) || 0;
    
    // Determine risk level based on score (0-100 scale from Rugcheck)
    let riskLevel: 'GOOD' | 'MEDIUM' | 'HIGH';
    if (data.score >= 70) riskLevel = 'GOOD';
    else if (data.score >= 40) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';
    
    // Calculate token age
    let tokenAge: string | null = null;
    if (data.token?.createAt) {
      const createdDate = new Date(data.token.createAt);
      const now = new Date();
      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        tokenAge = 'Today';
      } else if (diffDays === 1) {
        tokenAge = '1 day';
      } else if (diffDays < 30) {
        tokenAge = `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        tokenAge = months === 1 ? '1 month' : `${months} months`;
      } else {
        const years = Math.floor(diffDays / 365);
        tokenAge = years === 1 ? '1 year' : `${years} years`;
      }
    }
    
    const securityData: SecurityData = {
      score: data.score / 10, // Convert from 0-100 to 0-10
      riskLevel,
      topHoldersPercent,
      freezeAuthority: data.freezeAuthority !== null,
      mintAuthority: data.mintAuthority !== null,
      creatorPercent: data.creator?.pct || 0,
      tokenAge,
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
