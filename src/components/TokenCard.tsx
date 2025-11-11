import { Heart, MessageCircle, Bookmark, ExternalLink, Globe, ChevronDown, ChevronUp } from "lucide-react";
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
import { SecurityBadge } from "./SecurityBadge";
import { fetchRugcheckData } from "@/services/rugcheck";

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
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [securityData, setSecurityData] = useState<{
    securityScore?: number;
    riskLevel?: 'GOOD' | 'MEDIUM' | 'HIGH';
    topHoldersPercent?: number;
    freezeAuthority?: boolean;
    mintAuthority?: boolean;
    lpLockedPercent?: number;
    creatorPercent?: number;
    riskFactors?: string[];
  }>({});
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { isFavorited, addFavorite, removeFavorite } = useTokenFavorites();
  const { comments, refetch: refetchComments } = useTokenComments(token.id);
  const { likeCount, isLiked, toggleLike } = useTokenLikes(token.id);
  
  const isTokenFavorited = isFavorited(token.id);
  
  // Fetch security data with delay to avoid rate limiting
  useEffect(() => {
    if (!securityData.securityScore && token.contractAddress) {
      console.log(`[Security] Scheduling fetch for ${token.symbol} (${token.contractAddress})`);
      
      // Add random delay between 500ms-2000ms to avoid rate limiting
      const delay = 500 + Math.random() * 1500;
      
      const timer = setTimeout(() => {
        console.log(`[Security] Fetching for ${token.symbol}`);
        fetchRugcheckData(token.contractAddress!)
          .then(data => {
            if (data) {
              console.log(`[Security] Data received for ${token.symbol}:`, data);
              setSecurityData({
                securityScore: data.score,
                riskLevel: data.riskLevel,
                topHoldersPercent: data.topHoldersPercent,
                freezeAuthority: data.freezeAuthority,
                mintAuthority: data.mintAuthority,
                lpLockedPercent: data.lpLockedPercent,
                creatorPercent: data.creatorPercent,
                riskFactors: data.riskFactors,
              });
            } else {
              console.log(`[Security] No data available for ${token.symbol}`);
            }
          })
          .catch(error => {
            console.error(`[Security] Error fetching for ${token.symbol}:`, error);
          });
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [token.contractAddress, token.symbol, securityData.securityScore]);
  
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
                {securityData.securityScore !== undefined && securityData.riskLevel && (
                  <SecurityBadge 
                    riskLevel={securityData.riskLevel} 
                    score={securityData.securityScore}
                    showIcon={false}
                  />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground truncate block">{token.name}</span>
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
            {/* First row: Market Cap & Volume */}
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
            
            {/* Second row: Top Holders/Liquidity & LP Locked/Chain */}
            <div className="grid grid-cols-2 gap-1">
              {securityData.topHoldersPercent !== undefined ? (
                <div className="bg-secondary rounded-lg p-1">
                  <div className="text-[9px] text-muted-foreground">Top Holders</div>
                  <div className={`text-[11px] font-bold truncate ${
                    securityData.topHoldersPercent > 50 ? 'text-destructive' : 
                    securityData.topHoldersPercent > 30 ? 'text-warning' : 'text-success'
                  }`}>
                    {securityData.topHoldersPercent.toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="bg-secondary rounded-lg p-1">
                  <div className="text-[9px] text-muted-foreground">Liquidity</div>
                  <div className="text-[11px] font-bold text-foreground truncate">
                    {formatCurrency(token.liquidity)}
                  </div>
                </div>
              )}
              {securityData.lpLockedPercent !== undefined ? (
                <div className="bg-secondary rounded-lg p-1">
                  <div className="text-[9px] text-muted-foreground">LP Locked</div>
                  <div className={`text-[11px] font-bold truncate ${
                    securityData.lpLockedPercent > 80 ? 'text-success' : 
                    securityData.lpLockedPercent > 50 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {securityData.lpLockedPercent.toFixed(0)}%
                  </div>
                </div>
              ) : (
                <div className="bg-secondary rounded-lg p-1">
                  <div className="text-[9px] text-muted-foreground">Chain</div>
                  <div className="text-[11px] font-bold text-foreground truncate">
                    {token.chain}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Details - Expandable */}
          {securityData.securityScore !== undefined && (
            <div className="mb-1">
              <button
                onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                className="w-full bg-secondary rounded-lg p-1.5 flex items-center justify-between hover:bg-secondary/80 transition-colors"
              >
                <span className="text-[10px] font-semibold text-foreground">Security Details</span>
                {showSecurityDetails ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              
              {showSecurityDetails && (
                <div className="mt-1 bg-secondary rounded-lg p-2 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Risk Score:</span>
                    <span className="font-bold text-foreground">{securityData.securityScore.toFixed(1)}/10</span>
                  </div>
                  {securityData.creatorPercent !== undefined && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Creator Holding:</span>
                      <span className={`font-bold ${securityData.creatorPercent > 10 ? 'text-destructive' : 'text-success'}`}>
                        {securityData.creatorPercent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Freeze Authority:</span>
                    <span className={`font-bold ${securityData.freezeAuthority ? 'text-destructive' : 'text-success'}`}>
                      {securityData.freezeAuthority ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Mint Authority:</span>
                    <span className={`font-bold ${securityData.mintAuthority ? 'text-destructive' : 'text-success'}`}>
                      {securityData.mintAuthority ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {securityData.riskFactors && securityData.riskFactors.length > 0 && (
                    <div className="pt-1 border-t border-border/30">
                      <div className="text-[9px] text-muted-foreground mb-0.5">Risk Factors:</div>
                      {securityData.riskFactors.map((factor, i) => (
                        <div key={i} className="text-[9px] text-destructive">• {factor}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
