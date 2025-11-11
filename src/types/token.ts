import { DexPair } from "@/services/dexscreener";
import { fetchBirdeyeTokenInfo, extractSocialLinks } from "@/services/birdeye";

export interface Token {
  id: string;
  symbol: string;
  name: string;
  avatarUrl: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  sparklineData: number[];
  tags: string[];
  isSponsored?: boolean;
  isNew?: boolean;
  liquidity: number;
  chain: string;
  description: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  pairAddress?: string;
  dexScreenerUrl?: string;
  contractAddress?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  buys24h?: number;
  sells24h?: number;
  // Security data from Rugcheck
  securityScore?: number;        // 0-10 risk score (10 = safest)
  riskLevel?: 'GOOD' | 'MEDIUM' | 'HIGH';
  topHoldersPercent?: number;    // % held by top 10
  freezeAuthority?: boolean;     // Can freeze transfers
  mintAuthority?: boolean;       // Can mint more tokens
  lpLockedPercent?: number;      // % of LP locked
  creatorPercent?: number;       // % held by creator
  riskFactors?: string[];        // Array of risk descriptions
}

export const convertDexPairToToken = async (pair: DexPair): Promise<Token> => {
  const isNew = pair.pairCreatedAt ? 
    Date.now() - pair.pairCreatedAt < 24 * 60 * 60 * 1000 : false;
  
  const tags: string[] = [];
  if (isNew) tags.push('New');
  if (pair.labels?.includes('v2')) tags.push('V2');
  if (pair.labels?.includes('v3')) tags.push('V3');
  
  // Generate sparkline data from price change
  const priceChange = pair.priceChange.h24;
  const points = 24;
  const sparklineData: number[] = [];
  let value = 100;
  
  for (let i = 0; i < points; i++) {
    const progress = i / points;
    const randomVariation = (Math.random() - 0.5) * 5;
    const trendChange = (priceChange / 100) * progress * 100;
    value = 100 + trendChange + randomVariation;
    sparklineData.push(Math.max(50, value));
  }

  // Extract social media links from DexScreener
  const socials = pair.info?.socials || [];
  let twitter = socials.find(s => s.platform === 'twitter')?.handle;
  let telegram = socials.find(s => s.platform === 'telegram')?.handle;
  let discord = socials.find(s => s.platform === 'discord')?.handle;
  let website = pair.info?.websites?.[0]?.url;

  // Try Birdeye as fallback with 2s timeout (non-blocking)
  if ((!twitter || !telegram || !website) && pair.baseToken.address && pair.chainId.toLowerCase() === 'solana') {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      const birdeyePromise = fetchBirdeyeTokenInfo(pair.baseToken.address);
      
      const birdeyeData = await Promise.race([birdeyePromise, timeoutPromise]) as any;
      
      if (birdeyeData) {
        const birdeyeSocials = extractSocialLinks(birdeyeData);
        // Use Birdeye data as fallback
        website = website || birdeyeSocials.website;
        twitter = twitter || birdeyeSocials.twitter;
        telegram = telegram || birdeyeSocials.telegram;
        discord = discord || birdeyeSocials.discord;
      }
    } catch (error) {
      // Silently fail if timeout or error - don't block token loading
    }
  }

  return {
    id: pair.pairAddress,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    avatarUrl: pair.info?.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${pair.baseToken.symbol}&backgroundColor=00d084`,
    price: parseFloat(pair.priceUsd) || 0,
    change24h: pair.priceChange.h24 || 0,
    marketCap: pair.marketCap || pair.fdv || 0,
    volume24h: pair.volume.h24 || 0,
    sparklineData,
    tags,
    isNew,
    liquidity: pair.liquidity?.usd || 0,
    chain: pair.chainId.charAt(0).toUpperCase() + pair.chainId.slice(1),
    description: `Trading on ${pair.dexId}. ${pair.txns.h24.buys + pair.txns.h24.sells} transactions in 24h.`,
    likes: Math.floor(pair.txns.h24.buys / 10),
    comments: Math.floor(pair.txns.h24.sells / 20),
    pairAddress: pair.pairAddress,
    dexScreenerUrl: pair.url,
    contractAddress: pair.baseToken.address,
    website,
    twitter,
    telegram,
    discord,
    buys24h: pair.txns.h24.buys,
    sells24h: pair.txns.h24.sells,
  };
};
