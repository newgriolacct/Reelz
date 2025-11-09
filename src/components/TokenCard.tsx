import { Heart, MessageCircle, Bookmark, TrendingUp, TrendingDown } from "lucide-react";
import { Token } from "@/types/token";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { MiniChart } from "./MiniChart";
import { QuickTradeDrawer } from "./QuickTradeDrawer";

interface TokenCardProps {
  token: Token;
  onLike?: (tokenId: string) => void;
  onComment?: (tokenId: string) => void;
  onBookmark?: (tokenId: string) => void;
}

export const TokenCard = ({ token, onLike, onComment, onBookmark }: TokenCardProps) => {
  const [isLiked, setIsLiked] = useState(token.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(token.isBookmarked || false);
  const [showBuyDrawer, setShowBuyDrawer] = useState(false);
  const [showSellDrawer, setShowSellDrawer] = useState(false);
  
  const isPositive = token.change24h >= 0;

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(token.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(token.id);
  };

  return (
    <>
      <div className="h-screen snap-start flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={token.avatarUrl} 
                alt={token.symbol}
                className="w-12 h-12 rounded-full border-2 border-primary"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-lg">{token.symbol}</span>
                  {token.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{token.name}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 space-y-4">
            {/* Price & Chart */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    ${token.price.toFixed(6)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-positive' : 'text-negative'
                  }`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Market Cap</div>
                    <div className="text-foreground font-medium">
                      ${(token.marketCap / 1000000).toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Volume 24h</div>
                    <div className="text-foreground font-medium">
                      ${(token.volume24h / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-40">
                <MiniChart data={token.sparklineData} isPositive={isPositive} />
              </div>
            </div>

            {/* Description */}
            <div className="text-sm text-muted-foreground line-clamp-2">
              {token.description}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => setShowBuyDrawer(true)}
                className="bg-success hover:bg-success/90 text-success-foreground font-medium"
              >
                Buy
              </Button>
              <Button 
                onClick={() => setShowSellDrawer(true)}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Sell
              </Button>
            </div>

            {/* Social Actions */}
            <div className="flex items-center justify-around pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={handleLike}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
                <span className="text-sm">{token.likes + (isLiked ? 1 : 0)}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => onComment?.(token.id)}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{token.comments}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
              </Button>
            </div>
          </div>
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
