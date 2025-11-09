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
      <div className="flex gap-1 md:gap-2 lg:gap-2 p-1.5 md:p-2 lg:p-3 md:px-3 lg:px-4">
        {displayTokens.map((token) => {
          const isPositive = token.change24h >= 0;
          const isActive = token.id === currentTokenId;
          
          return (
            <button
              key={token.id}
              onClick={() => onTokenClick(token.id)}
              className={`flex-1 flex items-center gap-1 md:gap-1.5 lg:gap-2 px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2 rounded-md md:rounded-lg transition-all min-w-0 ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <img 
                src={token.avatarUrl} 
                alt={token.symbol}
                className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full flex-shrink-0"
              />
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-[10px] md:text-xs lg:text-sm font-bold truncate w-full">{token.symbol}</span>
                <div className="flex items-center gap-0.5 md:gap-1">
                  {isPositive ? (
                    <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 text-success flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 text-destructive flex-shrink-0" />
                  )}
                  <span className={`text-[9px] md:text-[10px] lg:text-xs font-medium whitespace-nowrap ${isPositive ? 'text-success' : 'text-destructive'}`}>
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
