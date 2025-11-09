import { Token } from "@/types/token";
import { formatPrice } from "@/lib/formatters";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendingTokensListProps {
  tokens: Token[];
  currentTokenId: string;
  onTokenClick: (tokenId: string) => void;
}

export const TrendingTokensList = ({ tokens, currentTokenId, onTokenClick }: TrendingTokensListProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 p-3 min-w-max">
          {tokens.map((token) => {
            const isPositive = token.change24h >= 0;
            const isActive = token.id === currentTokenId;
            
            return (
              <button
                key={token.id}
                onClick={() => onTokenClick(token.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <img 
                  src={token.avatarUrl} 
                  alt={token.symbol}
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex flex-col items-start min-w-[80px]">
                  <span className="text-sm font-bold">{token.symbol}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{formatPrice(token.price)}</span>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-destructive" />
                    )}
                    <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? '+' : ''}{Math.abs(token.change24h).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
