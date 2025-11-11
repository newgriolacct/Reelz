import { apiCache } from './apiCache';

const SOLSNIFFER_API = 'https://api.solsniffer.com/v1/token';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface SolsnifferResponse {
  address: string;
  snifScore: number;
  bundlePercentage?: number;
  sniperPercentage?: number;
  risks: Array<{
    name: string;
    description: string;
    severity: string;
  }>;
  topHolders: Array<{
    address: string;
    percentage: number;
  }>;
  deployer?: {
    address: string;
    percentage: number;
  };
}

export interface BundleSniperData {
  bundlePercentage: number;
  sniperPercentage: number;
  snifScore: number;
}

/**
 * Fetch bundle and sniper data from Solsniffer API
 */
export const fetchSolsnifferData = async (mintAddress: string): Promise<BundleSniperData | null> => {
  try {
    console.log(`[Solsniffer] Fetching data for: ${mintAddress}`);
    
    // Check cache first
    const cacheKey = `solsniffer:${mintAddress}`;
    const cached = apiCache.get<BundleSniperData>(cacheKey);
    if (cached) {
      console.log(`[Solsniffer] Using cached data for ${mintAddress}`);
      return cached;
    }

    // Note: Solsniffer requires an API key
    // Users need to sign up at https://www.solsniffer.com/api-service
    const apiKey = import.meta.env.VITE_SOLSNIFFER_API_KEY;
    
    if (!apiKey) {
      console.log('[Solsniffer] API key not configured');
      return null;
    }

    const url = `${SOLSNIFFER_API}/${mintAddress}`;
    console.log(`[Solsniffer] Calling API: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });
    
    console.log(`[Solsniffer] Response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[Solsniffer] No data found for ${mintAddress}`);
        return null;
      }
      if (response.status === 401) {
        console.log('[Solsniffer] Invalid API key');
        return null;
      }
      throw new Error(`Solsniffer API error: ${response.status}`);
    }

    const data: SolsnifferResponse = await response.json();
    console.log(`[Solsniffer] Raw data:`, data);
    
    const bundleSniperData: BundleSniperData = {
      bundlePercentage: data.bundlePercentage || 0,
      sniperPercentage: data.sniperPercentage || 0,
      snifScore: data.snifScore || 0,
    };
    
    console.log(`[Solsniffer] Processed data:`, bundleSniperData);
    
    // Cache the result
    apiCache.set(cacheKey, bundleSniperData, CACHE_DURATION);
    
    return bundleSniperData;
  } catch (error) {
    console.error(`[Solsniffer] Error fetching data for ${mintAddress}:`, error);
    return null;
  }
};
