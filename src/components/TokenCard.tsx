import { Heart, MessageCircle, Share2, ExternalLink } from "lucide-react";
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
      <div className="h-screen snap-start relative flex flex-col bg-background">
        {/* Token Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <img 
              src={token.avatarUrl} 
              alt={token.symbol}
              className="w-12 h-12 rounded-full border-2 border-primary shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-lg">{token.symbol}</span>
                {token.isNew && (
                  <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{token.name}</span>
            </div>
          </div>
          {token.dexScreenerUrl && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.open(token.dexScreenerUrl, '_blank')}
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
          )}
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
        <div className="relative px-4 pt-4 pb-20 flex flex-col justify-between bg-background" style={{ minHeight: '45vh' }}>
          {/* Price Info */}
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {formatPrice(token.price)}
            </div>
            <div className={`text-base font-semibold ${isPositive ? 'text-positive' : 'text-negative'}`}>
              {isPositive ? '+' : ''}{token.change24h.toFixed(2)}% (24h)
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Market Cap</div>
              <div className="text-base font-bold text-foreground">
                {formatCurrency(token.marketCap)}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Volume 24h</div>
              <div className="text-base font-bold text-foreground">
                {formatCurrency(token.volume24h)}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Liquidity</div>
              <div className="text-base font-bold text-foreground">
                {formatCurrency(token.liquidity)}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Chain</div>
              <div className="text-base font-bold text-foreground">
                {token.chain}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {token.description}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => setShowBuyDrawer(true)}
              size="lg"
              className="bg-success hover:bg-success/90 text-success-foreground font-bold text-base h-12"
            >
              Buy
            </Button>
            <Button 
              onClick={() => setShowSellDrawer(true)}
              size="lg"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-base h-12"
            >
              Sell
            </Button>
          </div>
        </div>

        {/* Right Side Actions (TikTok style) */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-4 z-10">
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center">
              <Heart 
                className={`w-6 h-6 ${isLiked ? 'fill-destructive text-destructive' : 'text-foreground'}`} 
              />
            </div>
            <span className="text-xs font-medium text-foreground">{token.likes + (isLiked ? 1 : 0)}</span>
          </button>

          <button
            onClick={() => onComment?.(token.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">{token.comments}</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center">
              <Share2 className="w-6 h-6 text-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Share</span>
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
