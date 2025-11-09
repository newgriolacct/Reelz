import { Token } from "@/types/token";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendingTokensListProps {
  tokens: Token[];
  currentTokenId: string;
  onTokenClick: (tokenId: string) => void;
}

export const TrendingTokensList = ({ tokens, currentTokenId, onTokenClick }: TrendingTokensListProps) => {
  // Display first 5 tokens, or all tokens if less than 5
  const displayTokens = tokens.slice(0, 5);
  
  // If we have fewer than 5 tokens, show placeholders
  const needsMoreTokens = tokens.length < 5;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex gap-1 md:gap-2 lg:gap-2 p-1.5 md:p-2 lg:p-3 md:px-3 lg:px-4">
        {displayTokens.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {displayTokens.map((token) => {
              const isPositive = token.change24h >= 0;
              const isActive = token.id === currentTokenId;
              
              return (
                <button
                  key={token.id}
                  onClick={() => onTokenClick(token.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 md:gap-1.5 px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 rounded-md md:rounded-lg transition-all min-w-0 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1 md:gap-1.5 w-full justify-center">
                    <img 
                      src={token.avatarUrl} 
                      alt={token.symbol}
                      className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm lg:text-base font-bold truncate">{token.symbol}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {isPositive ? (
                      <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5 text-success flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-2 h-2 md:w-2.5 md:h-2.5 text-destructive flex-shrink-0" />
                    )}
                    <span className={`text-[9px] md:text-[10px] lg:text-xs font-medium whitespace-nowrap ${
                      isActive 
                        ? 'text-black dark:text-white' 
                        : isPositive ? 'text-success' : 'text-destructive'
                    }`}>
                      {isPositive ? '+' : ''}{Math.abs(token.change24h).toFixed(1)}%
                    </span>
                  </div>
                </button>
              );
            })}
            {/* Show placeholder buttons if less than 5 tokens */}
            {needsMoreTokens && Array.from({ length: 5 - displayTokens.length }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="flex-1 flex flex-col items-center justify-center gap-1 md:gap-1.5 px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 lg:py-2.5 rounded-md md:rounded-lg bg-secondary/30 min-w-0"
              >
                <div className="flex items-center gap-1 md:gap-1.5 w-full justify-center">
                  <div className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full bg-muted/30 animate-pulse" />
                  <div className="w-12 h-3 bg-muted/30 rounded animate-pulse" />
                </div>
                <div className="w-10 h-2.5 bg-muted/30 rounded animate-pulse" />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
