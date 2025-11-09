import { Token } from "@/types/token";

// Generate realistic sparkline data
const generateSparkline = (trend: "up" | "down" | "volatile") => {
  const points = 24;
  const data: number[] = [];
  let value = 100;

  for (let i = 0; i < points; i++) {
    if (trend === "up") {
      value += Math.random() * 3 - 0.5;
    } else if (trend === "down") {
      value -= Math.random() * 3 - 0.5;
    } else {
      value += Math.random() * 6 - 3;
    }
    data.push(Math.max(50, value));
  }
  return data;
};

export const mockTokens: Token[] = [
  {
    id: "1",
    symbol: "MPOOL",
    name: "mPool",
    avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=MPOOL&backgroundColor=00d084",
    price: 0.000234,
    change24h: 12.34,
    marketCap: 2340000,
    volume24h: 456000,
    sparklineData: generateSparkline("up"),
    tags: ["New", "Verified"],
    isNew: true,
    liquidity: 850000,
    chain: "Solana",
    description: "Revolutionary liquidity pool aggregator bringing DeFi yields to the masses with AI-powered optimization.",
    likes: 234,
    comments: 45,
  },
  {
    id: "2",
    symbol: "PEPE",
    name: "Pepe Coin",
    avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=PEPE&backgroundColor=4ade80",
    price: 0.00000123,
    change24h: -5.67,
    marketCap: 12340000,
    volume24h: 2340000,
    sparklineData: generateSparkline("down"),
    tags: ["Meme", "Trending"],
    liquidity: 3200000,
    chain: "Ethereum",
    description: "The legendary meme coin that started it all. Community-driven, decentralized, and ready to moon. 🐸",
    likes: 1234,
    comments: 234,
  },
  {
    id: "3",
    symbol: "DOGE",
    name: "Dogecoin",
    avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=DOGE&backgroundColor=fbbf24",
    price: 0.087654,
    change24h: 3.45,
    marketCap: 45600000,
    volume24h: 8900000,
    sparklineData: generateSparkline("volatile"),
    tags: ["Meme", "Verified"],
    liquidity: 15600000,
    chain: "Dogecoin",
    description: "Much wow, very currency. The original meme coin backed by Elon and the community. To the moon! 🚀",
    likes: 5678,
    comments: 890,
  },
  {
    id: "4",
    symbol: "BONK",
    name: "Bonk",
    avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=BONK&backgroundColor=ef4444",
    price: 0.00001456,
    change24h: 23.12,
    marketCap: 3450000,
    volume24h: 1230000,
    sparklineData: generateSparkline("up"),
    tags: ["New", "Trending", "Audited"],
    isNew: true,
    liquidity: 980000,
    chain: "Solana",
    description: "Solana's first dog-themed meme coin. Fast, cheap, and ready to bonk the competition. Woof! 🐕",
    likes: 890,
    comments: 123,
  },
  {
    id: "5",
    symbol: "SHIB",
    name: "Shiba Inu",
    avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=SHIB&backgroundColor=f97316",
    price: 0.00000987,
    change24h: -2.34,
    marketCap: 34500000,
    volume24h: 5670000,
    sparklineData: generateSparkline("down"),
    tags: ["Meme", "Verified"],
    liquidity: 12300000,
    chain: "Ethereum",
    description: "The Dogecoin killer with a massive community and ecosystem. Shiba Army unite! 🐕‍🦺",
    likes: 3456,
    comments: 567,
  },
  {
    id: "6",
    symbol: "WIF",
    name: "Dogwifhat",
    avatarUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=WIF&backgroundColor=a855f7",
    price: 0.234567,
    change24h: 8.91,
    marketCap: 8900000,
    volume24h: 2340000,
    sparklineData: generateSparkline("up"),
    tags: ["Meme", "Trending"],
    liquidity: 2450000,
    chain: "Solana",
    description: "Just a dog wif a hat. Nothing more, nothing less. But what a hat it is! 🎩",
    likes: 678,
    comments: 89,
  },
];
