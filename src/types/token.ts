import { DexPair } from "@/services/dexscreener";
import { GeckoTerminalPool, GeckoTerminalResponse, getGeckoTerminalChartUrl } from "@/services/geckoterminal";

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
}

export const convertDexPairToToken = (pair: DexPair): Token => {
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

  // Extract social media links
  const socials = pair.info?.socials || [];
  const twitter = socials.find(s => s.platform === 'twitter')?.handle;
  const telegram = socials.find(s => s.platform === 'telegram')?.handle;
  const discord = socials.find(s => s.platform === 'discord')?.handle;
  const website = pair.info?.websites?.[0]?.url;

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
    liquidity: pair.liquidity.usd || 0,
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

/**
 * Convert GeckoTerminal pool data to Token format
 */
export const convertGeckoTerminalToToken = (
  pool: GeckoTerminalPool,
  baseToken: any,
  response: GeckoTerminalResponse
): Token => {
  const attributes = pool.attributes;
  const baseTokenData = response.included?.find(
    (item: any) => item.id === pool.relationships.base_token.data.id
  );
  
  // Extract network from pool ID (format: "network_pooladdress")
  const network = pool.id.split('_')[0];
  
  // Parse price change percentage
  const change24h = parseFloat(attributes.price_change_percentage.h24 || '0');
  
  // Get DexScreener URL for charts
  const poolAddress = attributes.address;
  const dexScreenerUrl = `https://dexscreener.com/${network}/${poolAddress}`;
  
  const token: Token = {
    id: pool.id,
    symbol: baseTokenData?.attributes?.symbol || baseToken?.symbol || 'UNKNOWN',
    name: baseTokenData?.attributes?.name || attributes.name,
    price: parseFloat(attributes.base_token_price_usd || '0'),
    change24h: change24h,
    volume24h: parseFloat(attributes.volume_usd.h24 || '0'),
    marketCap: parseFloat(attributes.market_cap_usd || attributes.fdv_usd || '0'),
    liquidity: parseFloat(attributes.reserve_in_usd || '0'),
    avatarUrl: baseTokenData?.attributes?.image_url || 'https://via.placeholder.com/40',
    description: `Trading on ${network}`,
    likes: Math.floor(attributes.transactions.h24.buys / 10),
    comments: Math.floor(attributes.transactions.h24.sells / 20),
    chain: network.toUpperCase(),
    isNew: false,
    tags: [],
    website: getGeckoTerminalChartUrl(network, poolAddress),
    twitter: null,
    telegram: null,
    discord: null,
    dexScreenerUrl: dexScreenerUrl,
    contractAddress: baseTokenData?.attributes?.address || '',
    sparklineData: [],
    buys24h: attributes.transactions.h24.buys,
    sells24h: attributes.transactions.h24.sells,
  };

  return token;
};
