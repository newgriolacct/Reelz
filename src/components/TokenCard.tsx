import { Heart, MessageCircle, Bookmark, ExternalLink, Copy } from "lucide-react";
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
import pumpfunIcon from "@/assets/pumpfun-icon.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { fetchTokenTransactions } from "@/services/solscan";
import { formatDistanceToNow } from "date-fns";

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
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

  const loadTransactions = async () => {
    if (!token.pairAddress || loadingTxs) return;
    setLoadingTxs(true);
    const txs = await fetchTokenTransactions(token.pairAddress);
    setTransactions(txs);
    setLoadingTxs(false);
  };

  return (
    <>
      <div className="h-[100dvh] snap-start relative flex flex-col bg-background overflow-hidden">
        {/* Top spacing for trending bar and network selector */}
        <div className="h-[100px] md:h-[110px] lg:h-[120px] flex-shrink-0" />
        
        {/* Token Header */}
        <div className="px-3 py-1 flex items-center justify-between bg-background flex-shrink-0 border-b border-border/50">
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
                    <img src={pumpfunIcon} alt="Pump.fun" className="w-3 h-3 rounded-full object-cover" />
                    Pump.fun
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground truncate">{token.name}</span>
                {token.contractAddress && (
                  <>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[9px] text-muted-foreground font-mono truncate">
                      {token.contractAddress.slice(0, 4)}...{token.contractAddress.slice(-4)}
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
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Blockchain Explorer Links */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
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
            {token.contractAddress && (
              <>
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
                {token.contractAddress.toLowerCase().endsWith('pump') && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.open(`https://pump.fun/${token.contractAddress}`, '_blank')}
                    title="View on Pump.fun"
                  >
                    <img src={pumpfunIcon} alt="Pump.fun" className="w-4 h-4 rounded-full object-cover" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chart/Transactions/Holders Tabs */}
        <Tabs defaultValue="chart" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-3 bg-secondary h-7 flex-shrink-0">
            <TabsTrigger value="chart" className="text-[10px]">Chart</TabsTrigger>
            <TabsTrigger value="transactions" className="text-[10px]" onClick={loadTransactions}>Transactions</TabsTrigger>
            <TabsTrigger value="holders" className="text-[10px]">Holders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <div ref={chartContainerRef} className="relative bg-card overflow-hidden h-full">
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
          </TabsContent>

          <TabsContent value="transactions" className="flex-1 overflow-y-auto mt-0">
            {loadingTxs ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="p-2 space-y-1">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="bg-secondary p-2 rounded">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge className={tx.type === 'buy' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                          {tx.type.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] font-mono">
                          ${tx.totalUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      {tx.amount.toFixed(2)} @ ${tx.priceUsd.toFixed(6)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No transactions available
              </div>
            )}
          </TabsContent>

          <TabsContent value="holders" className="flex-1 overflow-y-auto mt-0">
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-4 text-center">
              <p className="font-semibold mb-1">Holder data not available</p>
              <p className="text-xs">Public APIs don't provide holder information without authentication</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom - Token Info */}
        <div className="px-3 py-1 pb-16 flex flex-col gap-1 bg-background flex-shrink-0">
          {/* Price Info & Actions - Single Row */}
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-foreground leading-tight truncate">
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
          <div className="space-y-0.5 mb-0.5">
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-secondary rounded p-1">
                <div className="text-[9px] text-muted-foreground">MCap</div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {formatCurrency(token.marketCap)}
                </div>
              </div>
              <div className="bg-secondary rounded p-1">
                <div className="text-[9px] text-muted-foreground">Vol 24h</div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {formatCurrency(token.volume24h)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-secondary rounded p-1">
                <div className="text-[9px] text-muted-foreground">Liq</div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {formatCurrency(token.liquidity)}
                </div>
              </div>
              <div className="bg-secondary rounded p-1">
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
              size="sm"
              className="bg-success hover:bg-success/90 text-success-foreground font-bold text-xs h-8"
            >
              Buy
            </Button>
            <Button 
              onClick={() => setShowSellDrawer(true)}
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs h-8"
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
