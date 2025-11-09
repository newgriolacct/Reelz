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
}
