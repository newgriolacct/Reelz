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
      <div className="flex gap-1 p-1.5 overflow-x-auto scrollbar-hide">
        {displayTokens.map((token) => {
            const isPositive = token.change24h >= 0;
            const isActive = token.id === currentTokenId;
            
            return (
              <button
                key={token.id}
                onClick={() => onTokenClick(token.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all min-w-[70px] ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <img 
                  src={token.avatarUrl} 
                  alt={token.symbol}
                  className="w-5 h-5 rounded-full flex-shrink-0"
                />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[10px] font-bold truncate max-w-[40px]">{token.symbol}</span>
                  <div className="flex items-center gap-0.5">
                    {isPositive ? (
                      <TrendingUp className="w-2 h-2 text-success flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-2 h-2 text-destructive flex-shrink-0" />
                    )}
                    <span className={`text-[9px] font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
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
