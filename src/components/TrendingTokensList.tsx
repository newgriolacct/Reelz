import { Token } from "@/types/token";
import { formatPrice } from "@/lib/formatters";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendingTokensListProps {
  tokens: Token[];
  currentTokenId: string;
  onTokenClick: (tokenId: string) => void;
}

export const TrendingTokensList = ({ tokens, currentTokenId, onTokenClick }: TrendingTokensListProps) => {
  // Display only first 5 tokens
  const displayTokens = tokens.slice(0, 5);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex gap-2 p-2 px-3">
        {displayTokens.map((token) => {
            const isPositive = token.change24h >= 0;
            const isActive = token.id === currentTokenId;
            
            return (
              <button
                key={token.id}
                onClick={() => onTokenClick(token.id)}
                className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <img 
                  src={token.avatarUrl} 
                  alt={token.symbol}
                  className="w-6 h-6 rounded-full flex-shrink-0"
                />
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs font-bold truncate w-full">{token.symbol}</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px]">{formatPrice(token.price)}</span>
                    {isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5 text-success" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 text-destructive" />
                    )}
                    <span className={`text-[10px] font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? '+' : ''}{Math.abs(token.change24h).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </button>
            );
        })}
      </div>
    </div>
  );
};
