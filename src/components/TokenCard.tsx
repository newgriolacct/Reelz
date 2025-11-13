import { Sparkles, MessageSquare, Star, ExternalLink, Copy } from "lucide-react";
import { Token } from "@/types/token";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState, useEffect, useRef } from "react";
import { QuickTradeDrawer } from "./QuickTradeDrawer";
import { CommentsDrawer } from "./CommentsDrawer";
import { formatPrice, formatCurrency, formatNumber } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { useTokenFavorites } from "@/hooks/useTokenFavorites";
import { useTokenComments } from "@/hooks/useTokenComments";
import { useTokenLikes } from "@/hooks/useTokenLikes";
import pumpfunIcon from "@/assets/pumpfun-icon.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { fetchTokenTransactions, fetchTokenHolders } from "@/services/solscan";
import { formatDistanceToNow } from "date-fns";
import { fetchRugCheckReport, RugCheckReport } from "@/services/rugcheck";
import { Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface TokenCardProps {
  token: Token;
  onLike?: (tokenId: string) => void;
  onComment?: (tokenId: string) => void;
  onBookmark?: (tokenId: string) => void;
  isEagerLoad?: boolean;
  showTopSpacing?: boolean;
}

export const TokenCard = ({ token, onLike, onComment, onBookmark, isEagerLoad = false, showTopSpacing = true }: TokenCardProps) => {
  const [showBuyDrawer, setShowBuyDrawer] = useState(false);
  const [showSellDrawer, setShowSellDrawer] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [shouldLoadChart, setShouldLoadChart] = useState(isEagerLoad);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [holders, setHolders] = useState<any[]>([]);
  const [loadingHolders, setLoadingHolders] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [currentPrice, setCurrentPrice] = useState(token.price);
  const [priceChange, setPriceChange] = useState(token.change24h);
  const [chartKey, setChartKey] = useState(Date.now());
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [rugCheckData, setRugCheckData] = useState<RugCheckReport | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const { toast } = useToast();
  
  const { isFavorited, addFavorite, removeFavorite } = useTokenFavorites();
  const { comments, refetch: refetchComments } = useTokenComments(token.id);
  const { likeCount, isLiked, toggleLike } = useTokenLikes(token.id);
  
  const isTokenFavorited = isFavorited(token.id);
  
  // Fetch comments only when drawer opens
  useEffect(() => {
    if (showComments) {
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
    if (!token.pairAddress) return;
    setLoadingTxs(true);
    const txs = await fetchTokenTransactions(token.pairAddress);
    setTransactions(txs);
    setLoadingTxs(false);
  };

  const loadHolders = async () => {
    if (!token.contractAddress || loadingHolders) return;
    setLoadingHolders(true);
    const holderData = await fetchTokenHolders(token.contractAddress);
    setHolders(holderData);
    setLoadingHolders(false);
  };

  const loadSecurity = async () => {
    if (!token.contractAddress || loadingSecurity) return;
    setLoadingSecurity(true);
    const securityData = await fetchRugCheckReport(token.contractAddress);
    setRugCheckData(securityData);
    setLoadingSecurity(false);
  };

  // Auto-refresh transactions when tab is active
  useEffect(() => {
    if (activeTab !== 'transactions') return;
    
    // Initial load
    loadTransactions();
    
    // Set up interval for auto-refresh (increased to 30s to reduce API load)
    const interval = setInterval(() => {
      loadTransactions();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [activeTab, token.pairAddress]);

  // Auto-refresh price data every 10 seconds for real-time updates
  useEffect(() => {
    const refreshPrice = async () => {
      if (!token.contractAddress) return;
      
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.contractAddress}`);
        if (response.ok) {
          const data = await response.json();
          if (data.pairs && data.pairs.length > 0) {
            const bestPair = data.pairs[0];
            setCurrentPrice(parseFloat(bestPair.priceUsd));
            setPriceChange(bestPair.priceChange.h24);
          }
        }
      } catch (error) {
        console.error('Failed to refresh price:', error);
      }
    };

    // Initial price update
    refreshPrice();

    // Set up interval for real-time updates
    const interval = setInterval(refreshPrice, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [token.contractAddress]);

  return (
    <>
      <div className="h-[100dvh] snap-start relative flex flex-col bg-background overflow-hidden">
        {/* Top spacing for trending bar and network selector */}
        {showTopSpacing && (
          <div className="h-[145px] sm:h-[150px] md:h-[155px] lg:h-[160px] flex-shrink-0" />
        )}
        
        {/* Token Header */}
        <div className="px-3 py-2 flex items-center justify-between bg-background flex-shrink-0 border-b border-border/50 z-10">
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

        {/* Chart/Transactions/Holders/Security Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50 backdrop-blur-sm h-8 flex-shrink-0 p-0.5 gap-0.5 rounded-lg">
            <TabsTrigger 
              value="chart" 
              className="text-[9px] h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Chart
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="text-[9px] h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <span className="flex items-center gap-1">
                Txns
                {activeTab === 'transactions' && (
                  <span className="w-1 h-1 bg-success rounded-full animate-pulse" />
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="holders" 
              className="text-[9px] h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              onClick={loadHolders}
            >
              Holders
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="text-[9px] h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              onClick={loadSecurity}
            >
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <div ref={chartContainerRef} className="relative bg-card overflow-hidden h-full">
              {token.dexScreenerUrl ? (
                shouldLoadChart ? (
                  <iframe
                    key={chartKey}
                    src={`${token.dexScreenerUrl}?embed=1&theme=dark&trades=0&info=0`}
                    className="w-full border-0 bg-secondary"
                    style={{ height: 'calc(100% + 120px)', marginBottom: '-120px' }}
                    title={`${token.symbol} Chart`}
                    loading="lazy"
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

          <TabsContent value="transactions" className="flex-1 overflow-y-auto mt-0 animate-fade-in">
            {loadingTxs && transactions.length === 0 ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="p-2 space-y-1">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="bg-secondary p-2 rounded animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge className={tx.type === 'buy' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                          {tx.type.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] font-mono">
                          {formatCurrency(tx.totalUsd)}
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                      <span>{formatNumber(tx.amount)} @ {formatPrice(tx.priceUsd)}</span>
                      <button
                        onClick={() => window.open(`https://solscan.io/tx/${tx.txHash}`, '_blank')}
                        className="ml-auto hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
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

          <TabsContent value="holders" className="flex-1 overflow-y-auto mt-0 animate-fade-in">
            {loadingHolders ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : holders.length > 0 ? (
              <div className="p-2 space-y-1">
                {holders.map((holder, idx) => (
                  <div key={idx} className="bg-secondary p-2 rounded animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
                          #{idx + 1}
                        </Badge>
                        <span className="text-[9px] font-mono truncate">
                          {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-primary flex-shrink-0">
                        {holder.percentage.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                      <span>{formatNumber(holder.amount)} tokens</span>
                      <button
                        onClick={() => window.open(`https://solscan.io/account/${holder.address}`, '_blank')}
                        className="ml-auto hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No holder data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="flex-1 overflow-y-auto mt-0 animate-fade-in">
            {loadingSecurity ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : rugCheckData ? (
              <div className="p-2 space-y-2">
                {/* Overall Risk Score */}
                <div className="bg-secondary p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Risk Score</span>
                    <Badge 
                      className={
                        (rugCheckData.score || 0) >= 7000 
                          ? 'bg-success text-success-foreground' 
                          : (rugCheckData.score || 0) >= 4000 
                          ? 'bg-warning text-warning-foreground' 
                          : 'bg-destructive text-destructive-foreground'
                      }
                    >
                      {rugCheckData.score || 'N/A'}
                    </Badge>
                  </div>
                  {rugCheckData.rugged && (
                    <div className="flex items-center gap-1 text-destructive text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="font-semibold">RUGGED TOKEN</span>
                    </div>
                  )}
                </div>

                {/* Token Type */}
                {rugCheckData.tokenType && (
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-xs font-semibold text-foreground mb-1">Token Type</div>
                    <div className="text-xs text-muted-foreground">{rugCheckData.tokenType}</div>
                  </div>
                )}

                {/* Authorities */}
                <div className="bg-secondary p-3 rounded-lg">
                  <div className="text-xs font-semibold text-foreground mb-2">Token Authorities</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Freeze Authority</span>
                      <div className="flex items-center gap-1">
                        {rugCheckData.tokenMeta?.freezeAuthority ? (
                          <>
                            <XCircle className="w-3 h-3 text-destructive" />
                            <span className="text-[10px] text-destructive">Active</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            <span className="text-[10px] text-success">Revoked</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Mint Authority</span>
                      <div className="flex items-center gap-1">
                        {rugCheckData.tokenMeta?.mintAuthority ? (
                          <>
                            <XCircle className="w-3 h-3 text-destructive" />
                            <span className="text-[10px] text-destructive">Active</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            <span className="text-[10px] text-success">Revoked</span>
                          </>
                        )}
                      </div>
                    </div>
                    {rugCheckData.tokenMeta?.updateAuthority && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Update Authority</span>
                        <div className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-warning" />
                          <span className="text-[10px] text-warning">Active</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Creator Holdings */}
                {rugCheckData.creator && rugCheckData.creator.pct !== undefined && (
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-xs font-semibold text-foreground mb-2">Creator Holdings</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {rugCheckData.creator.address?.slice(0, 4)}...{rugCheckData.creator.address?.slice(-4)}
                      </span>
                      <Badge variant={rugCheckData.creator.pct > 5 ? 'destructive' : 'default'}>
                        {rugCheckData.creator.pct.toFixed(2)}%
                      </Badge>
                    </div>
                    {rugCheckData.creator.amount && (
                      <div className="text-[9px] text-muted-foreground mt-1">
                        {formatNumber(rugCheckData.creator.amount)} tokens
                      </div>
                    )}
                  </div>
                )}

                {/* Supply Information */}
                {(rugCheckData.totalSupply || rugCheckData.circulatingSupply || rugCheckData.lockedPct !== undefined) && (
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-xs font-semibold text-foreground mb-2">Supply Information</div>
                    <div className="space-y-1.5">
                      {rugCheckData.totalSupply && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Total Supply</span>
                          <span className="text-[10px] font-semibold text-foreground">
                            {formatNumber(rugCheckData.totalSupply)}
                          </span>
                        </div>
                      )}
                      {rugCheckData.circulatingSupply && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Circulating</span>
                          <span className="text-[10px] font-semibold text-foreground">
                            {formatNumber(rugCheckData.circulatingSupply)}
                          </span>
                        </div>
                      )}
                      {rugCheckData.lockedPct !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Locked</span>
                          <Badge variant={rugCheckData.lockedPct > 50 ? 'default' : 'destructive'}>
                            {rugCheckData.lockedPct.toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LP Information */}
                {rugCheckData.markets && rugCheckData.markets.length > 0 && rugCheckData.markets[0].lp && (
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-xs font-semibold text-foreground mb-2">Liquidity Pool</div>
                    <div className="space-y-1.5">
                      {rugCheckData.markets[0].lp.lpLockedPct !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">LP Locked</span>
                          <Badge variant={rugCheckData.markets[0].lp.lpLockedPct > 80 ? 'default' : 'destructive'}>
                            {rugCheckData.markets[0].lp.lpLockedPct.toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                      {rugCheckData.markets[0].lp.lpBurnPct !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">LP Burned</span>
                          <Badge variant={rugCheckData.markets[0].lp.lpBurnPct > 50 ? 'default' : 'secondary'}>
                            {rugCheckData.markets[0].lp.lpBurnPct.toFixed(1)}%
                          </Badge>
                        </div>
                      )}
                      {rugCheckData.markets[0].lp.lpTotalSupply !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">LP Supply</span>
                          <span className="text-[10px] font-semibold text-foreground">
                            {formatNumber(rugCheckData.markets[0].lp.lpTotalSupply)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Top Holders */}
                {rugCheckData.topHolders && rugCheckData.topHolders.length > 0 && (
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-xs font-semibold text-foreground mb-2">Top Holders</div>
                    <div className="space-y-1.5">
                      {rugCheckData.topHolders.slice(0, 5).map((holder, idx) => (
                        holder.pct !== undefined && (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                #{idx + 1}
                              </Badge>
                              {holder.address && (
                                <span className="text-[9px] text-muted-foreground font-mono">
                                  {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                                </span>
                              )}
                            </div>
                            <Badge variant={holder.pct > 10 ? 'destructive' : holder.pct > 5 ? 'secondary' : 'default'}>
                              {holder.pct.toFixed(2)}%
                            </Badge>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks - Filter out LP Providers warning */}
                {rugCheckData.risks && rugCheckData.risks.filter(r => !r.name.toLowerCase().includes('lp providers')).length > 0 && (
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-xs font-semibold text-foreground mb-2">Detected Risks</div>
                    <div className="space-y-2">
                      {rugCheckData.risks
                        .filter(risk => !risk.name.toLowerCase().includes('lp providers'))
                        .map((risk, idx) => (
                          <div key={idx} className="border-l-2 border-primary pl-2">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-foreground">{risk.name}</span>
                              <Badge 
                                variant={
                                  risk.level === 'danger' || risk.level === 'critical' 
                                    ? 'destructive' 
                                    : 'secondary'
                                }
                                className="text-[9px] px-1 py-0"
                              >
                                {risk.level}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{risk.description}</p>
                            <div className="text-[9px] text-muted-foreground mt-1">Score Impact: {risk.score}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {rugCheckData.fileMeta?.error && (
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-destructive text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="font-semibold">Error</span>
                    </div>
                    <p className="text-[10px] text-destructive/80 mt-1">{rugCheckData.fileMeta.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No security data available
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Bottom - Token Info */}
        <div className="px-3 py-1 pb-16 flex flex-col gap-1 bg-background flex-shrink-0">
          {/* Price Info & Actions - Single Row */}
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-foreground leading-tight truncate">
                {formatPrice(currentPrice)}
              </div>
              <div className={`text-xs font-semibold ${priceChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24h)
              </div>
            </div>
            
            {/* Action Buttons - Horizontal */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={toggleLike}
                className="flex flex-col items-center gap-0.5 min-w-[40px] transition-transform hover:scale-110"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center transition-all hover:bg-primary/10 hover:border-primary/50">
                  <Sparkles 
                    className={`w-3.5 h-3.5 transition-all ${isLiked ? 'fill-primary text-primary' : 'text-foreground'}`} 
                  />
                </div>
                <span className="text-[9px] font-medium text-foreground">{likeCount}</span>
              </button>

              <button
                onClick={() => setShowComments(true)}
                className="flex flex-col items-center gap-0.5 min-w-[40px] transition-transform hover:scale-110"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center transition-all hover:bg-primary/10 hover:border-primary/50">
                  <MessageSquare className="w-3.5 h-3.5 text-foreground" />
                </div>
                <span className="text-[9px] font-medium text-foreground">{comments.length}</span>
              </button>

              <button
                onClick={handleFavorite}
                className="flex flex-col items-center gap-0.5 min-w-[40px] transition-transform hover:scale-110"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center transition-all hover:bg-primary/10 hover:border-primary/50">
                  <Star 
                    className={`w-3.5 h-3.5 transition-all ${isTokenFavorited ? 'fill-primary text-primary' : 'text-foreground'}`} 
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
