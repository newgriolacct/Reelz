import { Heart, MessageCircle, Bookmark, ExternalLink, Globe, Flame, Copy } from "lucide-react";
import { Token } from "@/types/token";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState, useEffect, useRef } from "react";
import { QuickTradeDrawer } from "./QuickTradeDrawer";
import { CommentsDrawer } from "./CommentsDrawer";
import { formatPrice, formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { useTokenFavorites } from "@/hooks/useTokenFavorites";
import { useTokenComments } from "@/hooks/useTokenComments";
import { useTokenLikes } from "@/hooks/useTokenLikes";

interface TokenCardProps {
  token: Token;
  onLike?: (tokenId: string) => void;
  onComment?: (tokenId: string) => void;
  onBookmark?: (tokenId: string) => void;
  isEagerLoad?: boolean;
}

export const TokenCard = ({ token, onLike, onComment, onBookmark, isEagerLoad = false }: TokenCardProps) => {
  const [showBuyDrawer, setShowBuyDrawer] = useState(false);
  const [showSellDrawer, setShowSellDrawer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [shouldLoadChart, setShouldLoadChart] = useState(isEagerLoad);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { isFavorited, addFavorite, removeFavorite } = useTokenFavorites();
  const { comments, refetch: refetchComments } = useTokenComments(token.id);
  const { likeCount, isLiked, toggleLike } = useTokenLikes(token.id);
  
  const isTokenFavorited = isFavorited(token.id);
  
  // Update comments when drawer closes to refresh count
  useEffect(() => {
    if (!showComments) {
      refetchComments();
    }
  }, [showComments, refetchComments]);
  
  const isPositive = token.change24h >= 0;

  // Lazy load chart when card is near viewport
  useEffect(() => {
    if (shouldLoadChart) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadChart(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' } // Load 100px before entering viewport
    );

    if (chartContainerRef.current) {
      observer.observe(chartContainerRef.current);
    }

    return () => observer.disconnect();
  }, [shouldLoadChart]);

  const handleFavorite = async () => {
    if (isTokenFavorited) {
      const success = await removeFavorite(token.id);
      if (success) {
        toast({
          title: "Removed from favorites",
          description: "Token removed from your favorites",
        });
      }
    } else {
      const success = await addFavorite({
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        chain: token.chain,
        avatarUrl: token.avatarUrl,
        price: token.price,
      });
      if (success) {
        toast({
          title: "Added to favorites",
          description: "Token saved to your favorites",
        });
      }
    }
  };

  return (
    <>
      <div className="h-screen snap-start relative flex flex-col bg-background">
        {/* Top spacing for trending bar and network selector */}
        <div className="h-[110px] md:h-[120px] lg:h-[140px] flex-shrink-0" />
        
        {/* Token Header */}
        <div className="px-3 py-1.5 flex items-center justify-between bg-background flex-shrink-0 border-b border-border/50">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img 
              src={token.avatarUrl} 
              alt={token.symbol}
              className="w-8 h-8 rounded-full border-2 border-primary shadow-lg flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-foreground text-sm truncate">{token.symbol}</span>
                {token.isNew && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1 py-0">New</Badge>
                )}
                {token.contractAddress?.toLowerCase().endsWith('pump') && (
                  <Badge className="bg-[#14F195] text-black text-[10px] px-1 py-0 flex items-center gap-0.5 font-bold">
                    <Flame className="w-2.5 h-2.5" />
                    Pump.fun
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground truncate block">{token.name}</span>
              {token.contractAddress && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-muted-foreground font-mono truncate">
                    {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(token.contractAddress!);
                      toast({
                        title: "Copied!",
                        description: "Contract address copied to clipboard",
                      });
                    }}
                    className="flex-shrink-0 hover:text-primary transition-colors"
                  >
                    <Copy className="w-2.5 h-2.5 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Social and External Links */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {token.website && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(token.website, '_blank')}
                title="Website"
              >
                <Globe className="w-3 h-3" />
              </Button>
            )}
            {token.telegram && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(`https://t.me/${token.telegram}`, '_blank')}
                title="Telegram"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </Button>
            )}
            {token.twitter && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(`https://twitter.com/${token.twitter}`, '_blank')}
                title="X (Twitter)"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Button>
            )}
            {token.contractAddress && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(`https://solscan.io/token/${token.contractAddress}`, '_blank')}
                title="View on Solscan"
              >
                <img 
                  src="https://solscan.io/favicon.ico" 
                  alt="Solscan"
                  className="w-3 h-3"
                />
              </Button>
            )}
            {token.dexScreenerUrl && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(token.dexScreenerUrl, '_blank')}
                title="View on DexScreener"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* DexScreener Chart - Fixed compact height */}
        <div ref={chartContainerRef} className="relative bg-card overflow-hidden h-[200px] flex-shrink-0">
        {token.dexScreenerUrl ? (
            shouldLoadChart ? (
              <iframe
                src={`${token.dexScreenerUrl}?embed=1&theme=dark&trades=0&info=0`}
                className="w-full h-full border-0 bg-secondary"
                title={`${token.symbol} Chart`}
                loading="lazy"
                style={{ marginTop: '-40px', height: 'calc(100% + 80px)' }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-secondary">
                <Skeleton className="w-4/5 h-8" />
                <Skeleton className="w-3/4 h-32" />
                <Skeleton className="w-4/5 h-8" />
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <p className="text-muted-foreground">Chart not available</p>
            </div>
          )}
        </div>

        {/* Bottom - Token Info */}
        <div className="px-3 py-1.5 pb-16 flex flex-col gap-1 bg-background flex-shrink-0 overflow-y-auto">
          {/* Price Info & Actions - Single Row */}
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-foreground leading-tight truncate">
                {formatPrice(token.price)}
              </div>
              <div className={`text-xs font-semibold ${isPositive ? 'text-positive' : 'text-negative'}`}>
                {isPositive ? '+' : ''}{token.change24h.toFixed(2)}% (24h)
              </div>
            </div>
            
            {/* Action Buttons - Horizontal */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={toggleLike}
                className="flex flex-col items-center gap-0.5 min-w-[40px]"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <Heart 
                    className={`w-3.5 h-3.5 ${isLiked ? 'fill-destructive text-destructive' : 'text-foreground'}`} 
                  />
                </div>
                <span className="text-[9px] font-medium text-foreground">{likeCount}</span>
              </button>

              <button
                onClick={() => setShowComments(true)}
                className="flex flex-col items-center gap-0.5 min-w-[40px]"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <MessageCircle className="w-3.5 h-3.5 text-foreground" />
                </div>
                <span className="text-[9px] font-medium text-foreground">{comments.length}</span>
              </button>

              <button
                onClick={handleFavorite}
                className="flex flex-col items-center gap-0.5 min-w-[40px]"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <Bookmark 
                    className={`w-3.5 h-3.5 ${isTokenFavorited ? 'fill-primary text-primary' : 'text-foreground'}`} 
                  />
                </div>
                <span className="text-[9px] font-medium text-foreground">Save</span>
              </button>
            </div>
          </div>

          {/* Stats Grid - Compact */}
          <div className="space-y-0.5 mb-1">
            {/* Market Cap & Volume & Liquidity & Chain */}
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-secondary rounded-lg p-1">
                <div className="text-[9px] text-muted-foreground">Market Cap</div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {formatCurrency(token.marketCap)}
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-1">
                <div className="text-[9px] text-muted-foreground">Volume 24h</div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {formatCurrency(token.volume24h)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-secondary rounded-lg p-1">
                <div className="text-[9px] text-muted-foreground">Liquidity</div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {formatCurrency(token.liquidity)}
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-1">
                <div className="text-[9px] text-muted-foreground">Chain</div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {token.chain}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="grid grid-cols-2 gap-1.5">
            <Button 
              onClick={() => setShowBuyDrawer(true)}
              size="lg"
              className="bg-success hover:bg-success/90 text-success-foreground font-bold text-sm h-9"
            >
              Buy
            </Button>
            <Button 
              onClick={() => setShowSellDrawer(true)}
              size="lg"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-sm h-9"
            >
              Sell
            </Button>
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
      <CommentsDrawer
        open={showComments}
        onOpenChange={setShowComments}
        tokenId={token.id}
        tokenSymbol={token.symbol}
      />
    </>
  );
};
