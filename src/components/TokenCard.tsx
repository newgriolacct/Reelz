import { Sparkles, MessageSquare, Star, ExternalLink, Copy, Shield, Lock, AlertTriangle, CheckCircle2, User, Clock, Droplets } from "lucide-react";
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
import { fetchRugCheckData, getRiskLevelColor, formatRiskScore } from "@/services/rugcheck";
import { formatDistanceToNow } from "date-fns";

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
  const [securityData, setSecurityData] = useState<any>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [currentPrice, setCurrentPrice] = useState(token.price);
  const [priceChange, setPriceChange] = useState(token.change24h);
  const [chartKey, setChartKey] = useState(Date.now());
  const chartContainerRef = useRef<HTMLDivElement>(null);
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
    if (securityData || !token.contractAddress || loadingSecurity) return;
    setLoadingSecurity(true);
    const data = await fetchRugCheckData(token.contractAddress);
    setSecurityData(data);
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

        {/* Chart/Transactions/Holders Tabs */}
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
              <Shield className="w-3 h-3" />
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
              <div className="p-3 space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : securityData ? (
              <div className="p-3 space-y-3">
                {/* Overall Security Score */}
                {securityData.risks && securityData.risks.length > 0 && (
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold">Security Score</span>
                      </div>
                      <Badge className={getRiskLevelColor(securityData.risks[0].level)}>
                        {securityData.risks[0].level?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatRiskScore(securityData.risks[0].score)}
                    </div>
                  </div>
                )}

                {/* Authority Status */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Authority Status</h4>
                  <div className="grid gap-2">
                    <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs">Mint Authority</span>
                      </div>
                      {securityData.mintAuthority ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                            ⚠️ Active - High Risk
                          </Badge>
                          <span className="text-[8px] text-muted-foreground">Can mint unlimited tokens</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Revoked
                        </Badge>
                      )}
                    </div>
                    <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs">Freeze Authority</span>
                      </div>
                      {securityData.freezeAuthority ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">
                            ⚠️ Active - High Risk
                          </Badge>
                          <span className="text-[8px] text-muted-foreground">Can freeze user wallets</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Revoked
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Creator Holdings */}
                {securityData.creator && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Creator Holdings
                    </h4>
                    <div className="bg-secondary p-3 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Share</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={securityData.creator.share > 10 ? "destructive" : securityData.creator.share > 5 ? "outline" : "secondary"} className="text-[9px]">
                            {(securityData.creator.share ?? 0).toFixed(2)}%
                          </Badge>
                          {securityData.creator.share > 10 && (
                            <span className="text-[8px] text-destructive">High concentration</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Balance</span>
                        <span className="text-xs font-semibold">{(securityData.creator.balance ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Address</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(securityData.creator!.owner);
                            toast({ description: "Address copied!" });
                          }}
                          className="flex items-center gap-1 text-[9px] font-mono text-primary hover:text-primary/80 transition-colors"
                        >
                          {securityData.creator.owner.slice(0, 6)}...{securityData.creator.owner.slice(-4)}
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rug History */}
                {securityData.rugHistory && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Rug History
                    </h4>
                    <div className={`p-3 rounded-lg ${securityData.rugHistory.detected ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'}`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${securityData.rugHistory.detected ? 'text-destructive' : 'text-success'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold mb-1">
                            {securityData.rugHistory.detected ? '⚠️ Rug History Detected' : '✓ No Rug History'}
                          </div>
                          {securityData.rugHistory.details && (
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {securityData.rugHistory.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Token Supply */}
                {(securityData.totalSupply || securityData.circulatingSupply) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Token Supply</h4>
                    <div className="grid gap-2">
                      {securityData.totalSupply && (
                        <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Total Supply</span>
                          <span className="text-xs font-semibold">{(securityData.totalSupply ?? 0).toLocaleString()}</span>
                        </div>
                      )}
                      {securityData.circulatingSupply && (
                        <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Circulating Supply</span>
                          <span className="text-xs font-semibold">{(securityData.circulatingSupply ?? 0).toLocaleString()}</span>
                        </div>
                      )}
                      {securityData.token?.decimals && (
                        <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Decimals</span>
                          <span className="text-xs font-semibold">{securityData.token.decimals}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LP Information */}
                {securityData.markets && securityData.markets.length > 0 && securityData.markets[0].lp && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Droplets className="w-4 h-4" />
                      Liquidity Pool
                    </h4>
                    <div className="grid gap-2">
                      <div className="bg-secondary p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">LP Burned</span>
                          <span className="text-xs font-semibold">{(securityData.markets[0].lp.lpBurnedPct ?? 0).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-success h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(securityData.markets[0].lp.lpBurnedPct ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-secondary p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">LP Locked</span>
                          <span className="text-xs font-semibold">{(securityData.markets[0].lp.lpLockedPct ?? 0).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(securityData.markets[0].lp.lpLockedPct ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                      {securityData.markets[0].liquidity && (
                        <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Total Liquidity</span>
                          <span className="text-xs font-semibold">${(securityData.markets[0].liquidity ?? 0).toLocaleString()}</span>
                        </div>
                      )}
                      {securityData.markets[0].marketCap && (
                        <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Market Cap</span>
                          <span className="text-xs font-semibold">${(securityData.markets[0].marketCap ?? 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Lockers Info */}
                    {securityData.lockers && securityData.lockers.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium">Lock Details:</span>
                        {securityData.lockers.map((locker: any, idx: number) => (
                          <div key={idx} className="bg-muted/50 p-2 rounded text-[9px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Provider</span>
                              <span className="font-medium">{locker.provider}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="font-medium">{(locker.amount ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Unlock Date</span>
                              <span className="font-medium">{locker.unlockDate ? new Date(locker.unlockDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Risk Factors */}
                {securityData.risks && securityData.risks.length > 0 && securityData.risks[0].risks && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Analysis</h4>
                    <div className="space-y-2">
                      {securityData.risks[0].risks.map((risk: any, idx: number) => (
                        <div key={idx} className="bg-secondary p-3 rounded-lg animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              risk.level === 'danger' ? 'text-destructive' :
                              risk.level === 'warn' ? 'text-warning' :
                              'text-success'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-medium truncate">{risk.name}</span>
                                <Badge variant="outline" className={`text-[9px] ${getRiskLevelColor(risk.level)}`}>
                                  {risk.level}
                                </Badge>
                              </div>
                              {risk.value && (
                                <div className="text-[9px] font-semibold text-foreground mb-1">
                                  {risk.value}
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                {risk.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-6 text-center">
                <Shield className="w-12 h-12 mb-3 opacity-50" />
                <p>Security data not available</p>
                <p className="text-xs mt-1">Check back later</p>
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
