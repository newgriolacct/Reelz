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
import { fetchGoPlusSecurityData, getHoneypotStatus, getTaxLevel } from "@/services/goplus";
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
  const [goPlusData, setGoPlusData] = useState<any>(null);
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
  
  useEffect(() => {
    if (showComments) {
      refetchComments();
    }
  }, [showComments, refetchComments]);
  
  const isPositive = token.change24h >= 0;

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
        image: token.avatarUrl || '',
        price: token.price,
        chain: token.chain || 'solana'
      });
      
      if (success) {
        toast({
          title: "Added to favorites",
          description: "Token added to your favorites",
        });
      }
    }
    
    if (onBookmark) {
      onBookmark(token.id);
    }
  };

  const handleLike = async () => {
    await toggleLike();
    if (onLike) {
      onLike(token.id);
    }
  };

  const handleComment = () => {
    setShowComments(true);
    if (onComment) {
      onComment(token.id);
    }
  };

  const loadTransactions = async () => {
    if (transactions.length > 0 || !token.contractAddress) return;
    
    setLoadingTxs(true);
    try {
      const txs = await fetchTokenTransactions(token.contractAddress);
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTxs(false);
    }
  };

  const loadHolders = async () => {
    if (holders.length > 0 || !token.contractAddress) return;
    
    setLoadingHolders(true);
    try {
      const holdersList = await fetchTokenHolders(token.contractAddress);
      setHolders(holdersList);
    } catch (error) {
      console.error('Error loading holders:', error);
    } finally {
      setLoadingHolders(false);
    }
  };

  const loadSecurity = async () => {
    if ((securityData && goPlusData) || !token.contractAddress) return;
    
    setLoadingSecurity(true);
    try {
      const [rugCheckResult, goPlusResult] = await Promise.all([
        fetchRugCheckData(token.contractAddress),
        fetchGoPlusSecurityData(token.contractAddress)
      ]);
      
      setSecurityData(rugCheckResult);
      setGoPlusData(goPlusResult);
      console.log('GoPlus Data:', goPlusResult);
      console.log('RugCheck Data:', rugCheckResult);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoadingSecurity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    } else if (activeTab === 'holders') {
      loadHolders();
    } else if (activeTab === 'security') {
      loadSecurity();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'transactions') return;
    
    const interval = setInterval(() => {
      if (token.contractAddress) {
        fetchTokenTransactions(token.contractAddress).then(txs => {
          setTransactions(txs);
        }).catch(console.error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab, token.contractAddress]);

  useEffect(() => {
    const priceInterval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 0.02;
      const newPrice = currentPrice * (1 + variation);
      setCurrentPrice(newPrice);
      
      const priceChangeVariation = (Math.random() - 0.5) * 2;
      setPriceChange(Math.max(-100, Math.min(100, priceChange + priceChangeVariation)));
    }, 10000);
    
    return () => clearInterval(priceInterval);
  }, [currentPrice, priceChange]);

  return (
    <>
      <div className={`flex flex-col h-screen bg-background ${showTopSpacing ? 'pt-20' : ''} pb-16`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-10 flex-shrink-0">
            <TabsTrigger 
              value="chart" 
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent h-full text-xs"
            >
              Chart
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent h-full text-xs"
            >
              Txs
            </TabsTrigger>
            <TabsTrigger 
              value="holders" 
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent h-full text-xs"
            >
              Holders
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent h-full text-xs"
            >
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="flex-1 m-0 overflow-hidden" ref={chartContainerRef}>
            {shouldLoadChart ? (
              <iframe
                key={chartKey}
                src={token.dexScreenerUrl || `https://dexscreener.com/solana/${token.contractAddress}`}
                className="w-full h-full border-0"
                title="Token Chart"
              />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
          </TabsContent>

          <TabsContent value="transactions" className="flex-1 m-0 overflow-auto p-2">
            {loadingTxs ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No recent transactions
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, index) => (
                  <div key={index} className="border border-border rounded-lg p-2 bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        tx.type === 'buy' ? 'text-success' : 'text-destructive'
                      }`}>
                        {tx.type?.toUpperCase() || 'TRANSFER'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {tx.timestamp ? formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono">{formatNumber(tx.amount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Value:</span>
                      <span className="font-mono">{formatCurrency(tx.value || 0)}</span>
                    </div>
                    {tx.signature && (
                      <button
                        onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, '_blank')}
                        className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-1"
                      >
                        View on Solscan
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="holders" className="flex-1 m-0 overflow-auto p-2">
            {loadingHolders ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : holders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No holder data available
              </div>
            ) : (
              <div className="space-y-2">
                {holders.map((holder, index) => (
                  <div key={index} className="border border-border rounded-lg p-2 bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">Rank #{index + 1}</span>
                      <span className="text-xs font-bold text-primary">
                        {holder.percentage?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-muted-foreground truncate">
                        {holder.address?.slice(0, 8)}...{holder.address?.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="font-mono">{formatNumber(holder.amount || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="flex-1 m-0 overflow-auto p-2">
            {loadingSecurity ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (!securityData && !goPlusData) ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No security data available
              </div>
            ) : (
              <div className="space-y-3">
                {securityData?.risks?.[0] && (
                  <div className="border border-border rounded-lg p-3 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">RugCheck Risk Score</span>
                      </div>
                      <Badge className={getRiskLevelColor(securityData.risks[0].level)}>
                        {formatRiskScore(securityData.risks[0].score)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Risk Level: <span className="font-medium capitalize">{securityData.risks[0].level}</span>
                    </p>
                  </div>
                )}

                {goPlusData && (
                  <>
                    <div className="border border-border rounded-lg p-3 bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="text-sm font-semibold">Honeypot & Scam Detection</span>
                      </div>
                      <div className="space-y-1.5">
                        {goPlusData.is_honeypot && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Honeypot:</span>
                            <Badge className={
                              goPlusData.is_honeypot === '1' 
                                ? 'bg-destructive text-destructive-foreground' 
                                : 'bg-success text-success-foreground'
                            }>
                              {getHoneypotStatus(goPlusData.is_honeypot).text}
                            </Badge>
                          </div>
                        )}
                        {goPlusData.is_airdrop_scam && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Airdrop Scam:</span>
                            <Badge className={
                              goPlusData.is_airdrop_scam === '1' 
                                ? 'bg-destructive text-destructive-foreground' 
                                : 'bg-success text-success-foreground'
                            }>
                              {goPlusData.is_airdrop_scam === '1' ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                        {goPlusData.fake_token?.is_fake_token && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Fake Token:</span>
                            <Badge className={
                              goPlusData.fake_token.is_fake_token === '1' 
                                ? 'bg-destructive text-destructive-foreground' 
                                : 'bg-success text-success-foreground'
                            }>
                              {goPlusData.fake_token.is_fake_token === '1' ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-3 bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Trading Taxes</span>
                      </div>
                      <div className="space-y-1.5">
                        {goPlusData.buy_tax && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Buy Tax:</span>
                            <Badge className={getTaxLevel(goPlusData.buy_tax).status === 'danger' 
                              ? 'bg-destructive text-destructive-foreground' 
                              : getTaxLevel(goPlusData.buy_tax).status === 'warning'
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-success text-success-foreground'
                            }>
                              {getTaxLevel(goPlusData.buy_tax).text}
                            </Badge>
                          </div>
                        )}
                        {goPlusData.sell_tax && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Sell Tax:</span>
                            <Badge className={getTaxLevel(goPlusData.sell_tax).status === 'danger' 
                              ? 'bg-destructive text-destructive-foreground' 
                              : getTaxLevel(goPlusData.sell_tax).status === 'warning'
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-success text-success-foreground'
                            }>
                              {getTaxLevel(goPlusData.sell_tax).text}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-3 bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Contract Analysis</span>
                      </div>
                      <div className="space-y-1.5">
                        {goPlusData.is_open_source && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Open Source:</span>
                            <Badge className={goPlusData.is_open_source === '1' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                              {goPlusData.is_open_source === '1' ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                        {goPlusData.is_proxy && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Proxy Contract:</span>
                            <Badge className={goPlusData.is_proxy === '1' ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}>
                              {goPlusData.is_proxy === '1' ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                        {goPlusData.is_mintable && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Mintable:</span>
                            <Badge className={goPlusData.is_mintable === '1' ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}>
                              {goPlusData.is_mintable === '1' ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                        {goPlusData.can_take_back_ownership && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Can Take Back Ownership:</span>
                            <Badge className={goPlusData.can_take_back_ownership === '1' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}>
                              {goPlusData.can_take_back_ownership === '1' ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                        {goPlusData.transfer_pausable && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Transfer Pausable:</span>
                            <Badge className={goPlusData.transfer_pausable === '1' ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}>
                              {goPlusData.transfer_pausable === '1' ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {(goPlusData.creator_percent || goPlusData.owner_percent) && (
                      <div className="border border-border rounded-lg p-3 bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">Creator & Owner Holdings</span>
                        </div>
                        <div className="space-y-1.5">
                          {goPlusData.creator_percent && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Creator Holdings:</span>
                              <span className="font-mono">{(parseFloat(goPlusData.creator_percent) * 100).toFixed(2)}%</span>
                            </div>
                          )}
                          {goPlusData.creator_balance && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Creator Balance:</span>
                              <span className="font-mono">{formatNumber(parseFloat(goPlusData.creator_balance))}</span>
                            </div>
                          )}
                          {goPlusData.owner_percent && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Owner Holdings:</span>
                              <span className="font-mono">{(parseFloat(goPlusData.owner_percent) * 100).toFixed(2)}%</span>
                            </div>
                          )}
                          {goPlusData.owner_balance && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Owner Balance:</span>
                              <span className="font-mono">{formatNumber(parseFloat(goPlusData.owner_balance))}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {securityData && (
                  <div className="border border-border rounded-lg p-3 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Authority Status</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Mint Authority:</span>
                        <Badge className={securityData.mintAuthority ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}>
                          {securityData.mintAuthority ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Freeze Authority:</span>
                        <Badge className={securityData.freezeAuthority ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}>
                          {securityData.freezeAuthority ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {securityData?.markets?.[0]?.lp && (
                  <div className="border border-border rounded-lg p-3 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Liquidity Pool</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">LP Locked:</span>
                        <span className="font-mono">{securityData.markets[0].lp.lpLockedPct?.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">LP Burned:</span>
                        <span className="font-mono">{securityData.markets[0].lp.lpBurnedPct?.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex-shrink-0 border-t border-border bg-background">
          <div className="grid grid-cols-4 gap-1 p-2 text-[10px]">
            <div className="text-center">
              <div className="text-muted-foreground">Market Cap</div>
              <div className="font-bold text-foreground">{formatCurrency(token.marketCap)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Volume</div>
              <div className="font-bold text-foreground">{formatCurrency(token.volume24h)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Liquidity</div>
              <div className="font-bold text-foreground">{formatCurrency(token.liquidity)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Chain</div>
              <div className="font-bold text-foreground">{token.chain || 'Solana'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 gap-2">
            <div className="flex-1">
              <div className="text-lg font-bold text-foreground">
                {formatPrice(currentPrice)}
              </div>
              <div className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <Button 
                size="sm" 
                onClick={() => setShowBuyDrawer(true)}
                className="bg-success text-success-foreground hover:bg-success/90 h-9 px-4"
              >
                Buy
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowSellDrawer(true)}
                className="h-9 px-4"
              >
                Sell
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLike}
                className={`h-9 w-9 ${isLiked ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                <Sparkles className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleComment}
                className="h-9 w-9 text-muted-foreground relative"
              >
                <MessageSquare className="h-4 w-4" />
                {comments.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {comments.length}
                  </span>
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleFavorite}
                className={`h-9 w-9 ${isTokenFavorited ? 'text-warning' : 'text-muted-foreground'}`}
              >
                <Star className="h-4 w-4" fill={isTokenFavorited ? 'currentColor' : 'none'} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <QuickTradeDrawer
        open={showBuyDrawer}
        onClose={() => setShowBuyDrawer(false)}
        token={token}
        type="buy"
      />

      <QuickTradeDrawer
        open={showSellDrawer}
        onClose={() => setShowSellDrawer(false)}
        token={token}
        type="sell"
      />

      <CommentsDrawer
        open={showComments}
        onClose={() => setShowComments(false)}
        tokenId={token.id}
        tokenSymbol={token.symbol}
      />
    </>
  );
};
