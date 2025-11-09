import { Heart, MessageCircle, Share2, ExternalLink, Globe } from "lucide-react";
import { Token } from "@/types/token";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { QuickTradeDrawer } from "./QuickTradeDrawer";
import { formatPrice, formatCurrency } from "@/lib/formatters";

interface TokenCardProps {
  token: Token;
  onLike?: (tokenId: string) => void;
  onComment?: (tokenId: string) => void;
  onBookmark?: (tokenId: string) => void;
}

export const TokenCard = ({ token, onLike, onComment, onBookmark }: TokenCardProps) => {
  const [isLiked, setIsLiked] = useState(token.isLiked || false);
  const [showBuyDrawer, setShowBuyDrawer] = useState(false);
  const [showSellDrawer, setShowSellDrawer] = useState(false);
  
  const isPositive = token.change24h >= 0;

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(token.id);
  };

  return (
    <>
      <div className="h-screen snap-start relative flex flex-col bg-background pt-[100px] md:pt-28 lg:pt-32">
        {/* Token Header */}
        <div className="px-3 md:px-4 lg:px-6 pt-2 md:pt-4 lg:pt-5 pb-1.5 md:pb-2 lg:pb-3 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4 min-w-0 flex-1">
            <img 
              src={token.avatarUrl} 
              alt={token.symbol}
              className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-primary shadow-lg flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="font-bold text-foreground text-base md:text-lg lg:text-xl truncate">{token.symbol}</span>
                {token.isNew && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs lg:text-sm px-1 md:px-2 py-0">New</Badge>
                )}
              </div>
              <span className="text-xs md:text-sm lg:text-base text-muted-foreground truncate block">{token.name}</span>
            </div>
          </div>
          
          {/* Social and External Links */}
          <div className="flex items-center gap-0.5 md:gap-1 lg:gap-1.5 flex-shrink-0">
            {token.website && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9"
                onClick={() => window.open(token.website, '_blank')}
                title="Website"
              >
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              </Button>
            )}
            {token.telegram && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9"
                onClick={() => window.open(`https://t.me/${token.telegram}`, '_blank')}
                title="Telegram"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </Button>
            )}
            {token.twitter && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9"
                onClick={() => window.open(`https://twitter.com/${token.twitter}`, '_blank')}
                title="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Button>
            )}
            {token.contractAddress && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9"
                onClick={() => window.open(`https://solscan.io/token/${token.contractAddress}`, '_blank')}
                title="View on Solscan"
              >
                <img 
                  src="https://solscan.io/favicon.ico" 
                  alt="Solscan"
                  className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5"
                />
              </Button>
            )}
            {token.dexScreenerUrl && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9"
                onClick={() => window.open(token.dexScreenerUrl, '_blank')}
                title="View on DexScreener"
              >
                <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* DexScreener Chart */}
        <div className="flex-1 relative bg-card overflow-hidden">
          {token.dexScreenerUrl ? (
            <iframe
              src={`${token.dexScreenerUrl}?embed=1&theme=dark&trades=0&info=0`}
              className="w-full h-full border-0"
              title={`${token.symbol} Chart`}
              style={{ marginTop: '-40px', height: 'calc(100% + 80px)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <p className="text-muted-foreground">Chart not available</p>
            </div>
          )}
        </div>

        {/* Bottom - Token Info */}
        <div className="relative px-3 md:px-4 lg:px-6 pt-3 md:pt-4 lg:pt-5 pb-20 flex flex-col justify-between bg-background" style={{ minHeight: '45vh' }}>
          {/* Price Info */}
          <div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-0.5 md:mb-1">
              {formatPrice(token.price)}
            </div>
            <div className={`text-sm md:text-base lg:text-lg font-semibold ${isPositive ? 'text-positive' : 'text-negative'}`}>
              {isPositive ? '+' : ''}{token.change24h.toFixed(2)}% (24h)
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 lg:gap-3">
            <div className="bg-secondary rounded-lg p-2 md:p-3 lg:p-4">
              <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5">Market Cap</div>
              <div className="text-sm md:text-base lg:text-lg font-bold text-foreground truncate">
                {formatCurrency(token.marketCap)}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-2 md:p-3 lg:p-4">
              <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5">Volume 24h</div>
              <div className="text-sm md:text-base lg:text-lg font-bold text-foreground truncate">
                {formatCurrency(token.volume24h)}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-2 md:p-3 lg:p-4">
              <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5">Liquidity</div>
              <div className="text-sm md:text-base lg:text-lg font-bold text-foreground truncate">
                {formatCurrency(token.liquidity)}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-2 md:p-3 lg:p-4">
              <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5">Chain</div>
              <div className="text-sm md:text-base lg:text-lg font-bold text-foreground truncate">
                {token.chain}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-[11px] md:text-xs lg:text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {token.description}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
            <Button 
              onClick={() => setShowBuyDrawer(true)}
              size="lg"
              className="bg-success hover:bg-success/90 text-success-foreground font-bold text-sm md:text-base lg:text-lg h-11 md:h-12 lg:h-14"
            >
              Buy
            </Button>
            <Button 
              onClick={() => setShowSellDrawer(true)}
              size="lg"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-sm md:text-base lg:text-lg h-11 md:h-12 lg:h-14"
            >
              Sell
            </Button>
          </div>
        </div>

        {/* Right Side Actions (TikTok style) */}
        <div className="absolute right-2 md:right-4 lg:right-6 bottom-24 flex flex-col gap-3 md:gap-4 lg:gap-5 z-10">
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-0.5 md:gap-1"
          >
            <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center">
              <Heart 
                className={`w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ${isLiked ? 'fill-destructive text-destructive' : 'text-foreground'}`} 
              />
            </div>
            <span className="text-[10px] md:text-xs lg:text-sm font-medium text-foreground">{token.likes + (isLiked ? 1 : 0)}</span>
          </button>

          <button
            onClick={() => onComment?.(token.id)}
            className="flex flex-col items-center gap-0.5 md:gap-1"
          >
            <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-foreground" />
            </div>
            <span className="text-[10px] md:text-xs lg:text-sm font-medium text-foreground">{token.comments}</span>
          </button>

          <button className="flex flex-col items-center gap-0.5 md:gap-1">
            <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center">
              <Share2 className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-foreground" />
            </div>
            <span className="text-[10px] md:text-xs lg:text-sm font-medium text-foreground">Share</span>
          </button>
        </div>
      </div>

      <QuickTradeDrawer
        token={token}
        type="buy"
        open={showBuyDrawer}
        onOpenChange={setShowBuyDrawer}
      />
      <QuickTradeDrawer
        token={token}
        type="sell"
        open={showSellDrawer}
        onOpenChange={setShowSellDrawer}
      />
    </>
  );
};
