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
      { rootMargin: '100px' }
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
        price: token.price,
        avatarUrl: token.avatarUrl || '',
        chain: token.chain,
      });
      if (success) {
        toast({
          title: "Added to favorites",
          description: "Token added to your favorites",
        });
      }
    }
    onBookmark?.(token.id);
  };

  const handleLike = async () => {
    const success = await toggleLike();
    if (success) {
      onLike?.(token.id);
    }
  };

  const handleComment = () => {
    setShowComments(true);
    onComment?.(token.id);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(token.id);
    toast({
      title: "Address copied",
      description: "Token address copied to clipboard",
    });
  };

  // Auto-refresh price every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 2;
      setCurrentPrice(prev => prev * (1 + change / 100));
      setPriceChange(prev => prev + change);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh transactions when tab is active
  useEffect(() => {
    if (activeTab === 'transactions' && transactions.length === 0) {
      loadTransactions();
    }
  }, [activeTab]);

  const loadTransactions = async () => {
    setLoadingTxs(true);
    try {
      const txs = await fetchTokenTransactions(token.id);
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTxs(false);
    }
  };

  const loadHolders = async () => {
    setLoadingHolders(true);
    try {
      const holdersData = await fetchTokenHolders(token.id);
      setHolders(holdersData);
    } catch (error) {
      console.error('Error loading holders:', error);
    } finally {
      setLoadingHolders(false);
    }
  };

  const loadSecurity = async () => {
    setLoadingSecurity(true);
    try {
      const data = await fetchRugCheckData(token.id);
      setSecurityData(data);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoadingSecurity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'holders' && holders.length === 0) {
      loadHolders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'security' && !securityData) {
      loadSecurity();
    }
  }, [activeTab]);

  return (
    <>
      <div className={`w-full max-w-md mx-auto ${showTopSpacing ? 'mt-20' : ''}`}>
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-border/50">
          {/* Header */}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={token.avatarUrl}
                    alt={token.symbol}
                    className="w-14 h-14 rounded-full ring-2 ring-primary/20"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">${token.symbol}</h2>
                    <a
                      href={`https://solscan.io/token/${token.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">{token.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">CA:</span>
                <code className="text-xs font-mono text-foreground">
                  {token.id.slice(0, 6)}...{token.id.slice(-4)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-foreground">
                {formatPrice(currentPrice)}
              </div>
              <div className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                <span>{isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(priceChange).toFixed(2)}%</span>
                <span className="text-muted-foreground">24h</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-12 px-6">
              <TabsTrigger value="chart" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Chart
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Transactions
              </TabsTrigger>
              <TabsTrigger value="holders" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Holders
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="m-0 p-0" ref={chartContainerRef}>
              <div className="w-full h-[400px] bg-muted/20">
                {shouldLoadChart ? (
                  <iframe
                    key={chartKey}
                    src={`https://dexscreener.com/solana/${token.id}?embed=1&theme=dark&trades=0&info=0`}
                    className="w-full h-full border-0"
                    title={`${token.symbol} Chart`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="m-0 p-6">
              {loadingTxs ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {transactions.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'buy' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                          {tx.type === 'buy' ? '↑' : '↓'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {tx.type === 'buy' ? 'Buy' : 'Sell'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {formatCurrency(tx.value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(tx.amount)} {token.symbol}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              )}
            </TabsContent>

            <TabsContent value="holders" className="m-0 p-6">
              {loadingHolders ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : holders.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {holders.map((holder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-full">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground font-mono">
                            {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {holder.percentage}% of supply
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {formatNumber(holder.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No holder data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="m-0 p-6">
              {loadingSecurity ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : securityData ? (
                <div className="space-y-4">
                  {/* Risk Score */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Risk Score</span>
                      <Badge className={getRiskLevelColor(securityData.risks?.[0]?.level || 'unknown')}>
                        {formatRiskScore(securityData.risks?.[0]?.score || 0)}
                      </Badge>
                    </div>
                  </div>

                  {/* Liquidity */}
                  {securityData.markets && securityData.markets[0] && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Liquidity</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-foreground">{formatCurrency(securityData.markets[0].liquidity)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">LP Locked</span>
                          <span className="text-foreground">{securityData.markets[0].lp.lpLockedPct}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">LP Burned</span>
                          <span className="text-foreground">{securityData.markets[0].lp.lpBurnedPct}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Authorities */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Authority Status</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Mint Authority</span>
                        <Badge variant={securityData.mintAuthority ? "destructive" : "default"}>
                          {securityData.mintAuthority ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Freeze Authority</span>
                        <Badge variant={securityData.freezeAuthority ? "destructive" : "default"}>
                          {securityData.freezeAuthority ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Risk Items */}
                  {securityData.risks && securityData.risks[0]?.risks && (
                    <div className="space-y-2">
                      {securityData.risks[0].risks.slice(0, 5).map((risk: any, index: number) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                              risk.level === 'danger' ? 'text-destructive' : 
                              risk.level === 'warn' ? 'text-warning' : 
                              'text-muted-foreground'
                            }`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">{risk.name}</div>
                              <div className="text-xs text-muted-foreground">{risk.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No security data available
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer Stats */}
          <div className="p-6 bg-muted/20 border-t border-border">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                <div className="text-sm font-semibold text-foreground">{formatCurrency(token.marketCap)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Volume 24h</div>
                <div className="text-sm font-semibold text-foreground">{formatCurrency(token.volume24h)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Liquidity</div>
                <div className="text-sm font-semibold text-foreground">{formatCurrency(token.liquidity)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Chain</div>
                <div className="text-sm font-semibold text-foreground capitalize">{token.chain}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-5 gap-2">
              <Button
                onClick={() => setShowBuyDrawer(true)}
                className="col-span-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                Buy
              </Button>
              <Button
                onClick={() => setShowSellDrawer(true)}
                variant="outline"
                className="col-span-2"
              >
                Sell
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLike}
                className={isLiked ? "text-destructive" : ""}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-around mt-4 pt-4 border-t border-border">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Sparkles className={`w-5 h-5 ${isLiked ? 'fill-primary text-primary' : ''}`} />
                <span className="text-sm font-medium">{likeCount}</span>
              </button>
              <button
                onClick={handleComment}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">{comments?.length || 0}</span>
              </button>
              <button
                onClick={handleFavorite}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Star className={`w-5 h-5 ${isTokenFavorited ? 'fill-primary text-primary' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuickTradeDrawer
        open={showBuyDrawer}
        onOpenChange={setShowBuyDrawer}
        token={token}
        type="buy"
      />

      <QuickTradeDrawer
        open={showSellDrawer}
        onOpenChange={setShowSellDrawer}
        token={token}
        type="sell"
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
