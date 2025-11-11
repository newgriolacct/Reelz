import { apiCache } from './apiCache';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface BirdeyeTokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  extensions?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
}

interface BirdeyeTokenInfo {
  success: boolean;
  data: BirdeyeTokenMetadata;
}

/**
 * Fetch token metadata including social links from Birdeye via edge function
 */
export const fetchBirdeyeTokenInfo = async (tokenAddress: string): Promise<BirdeyeTokenMetadata | null> => {
  try {
    console.log(`[Birdeye] Fetching metadata for: ${tokenAddress}`);
    
    // Check cache first
    const cacheKey = `birdeye:${tokenAddress}`;
    const cached = apiCache.get<BirdeyeTokenMetadata>(cacheKey);
    if (cached) {
      console.log(`[Birdeye] Using cached data for ${tokenAddress}`);
      return cached;
    }

    const backendUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/birdeye-metadata`;
    console.log(`[Birdeye] Calling edge function: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenAddress }),
    });
    
    console.log(`[Birdeye] Response status: ${response.status}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[Birdeye] No data found for ${tokenAddress}`);
        return null;
      }
      if (response.status === 429) {
        console.log(`[Birdeye] Rate limited for ${tokenAddress}`);
        return null;
      }
      throw new Error(`Birdeye API error: ${response.status}`);
    }

    const result: BirdeyeTokenInfo = await response.json();
    console.log(`[Birdeye] Raw data:`, result);
    
    if (!result.success || !result.data) {
      console.log(`[Birdeye] Invalid response for ${tokenAddress}`);
      return null;
    }
    
    const metadata = result.data;
    console.log(`[Birdeye] Processed data:`, metadata);
    
    // Cache the result
    apiCache.set(cacheKey, metadata, CACHE_DURATION);
    
    return metadata;
  } catch (error) {
    console.error(`[Birdeye] Error fetching data for ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * Extract social links from Birdeye metadata
 */
export const extractSocialLinks = (metadata: BirdeyeTokenMetadata | null) => {
  if (!metadata?.extensions) {
    return {
      website: undefined,
      twitter: undefined,
      telegram: undefined,
      discord: undefined,
    };
  }

  return {
    website: metadata.extensions.website,
    twitter: metadata.extensions.twitter,
    telegram: metadata.extensions.telegram,
    discord: metadata.extensions.discord,
  };
};
