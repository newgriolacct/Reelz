import { Wallet as WalletIcon, CheckCircle, TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Skeleton } from "@/components/ui/skeleton";
import { QuickTradeDrawer } from "@/components/QuickTradeDrawer";

interface TokenHolding {
  mint: string;
  symbol: string;
  name: string;
  image: string;
  balance: number;
  price: number;
  value: number;
}

export default function Wallet() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenHolding | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');

  useEffect(() => {
    const createProfile = async () => {
      if (connected && publicKey) {
        try {
          const walletAddress = publicKey.toString();
          
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

          if (!existingProfile) {
            // Create new profile
            const { error } = await supabase
              .from('profiles')
              .insert([{ wallet_address: walletAddress }]);

            if (error) {
              console.error('Error creating profile:', error);
              toast({
                title: "Error",
                description: "Failed to create profile",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Success",
                description: "Wallet connected and profile created!",
              });
            }
          } else {
            toast({
              title: "Welcome back!",
              description: "Wallet connected successfully",
            });
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    createProfile();
  }, [connected, publicKey, toast]);

  const fetchWalletData = async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    try {
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Fetch token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Process token holdings
      const holdings: TokenHolding[] = [];
      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info;
        const mint = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount;

        if (balance > 0) {
          // Fetch token metadata from DexScreener or fallback
          try {
            const response = await fetch(
              `https://api.dexscreener.com/latest/dex/tokens/${mint}`
            );
            const data = await response.json();
            
            if (data.pairs && data.pairs.length > 0) {
              const pair = data.pairs[0];
              const price = parseFloat(pair.priceUsd) || 0;
              
              holdings.push({
                mint,
                symbol: pair.baseToken.symbol || 'UNKNOWN',
                name: pair.baseToken.name || 'Unknown Token',
                image: pair.info?.imageUrl || 'https://via.placeholder.com/40',
                balance,
                price,
                value: balance * price,
              });
            }
          } catch (err) {
            console.error(`Failed to fetch token ${mint}:`, err);
          }
        }
      }

      // Sort by value (highest first)
      holdings.sort((a, b) => b.value - a.value);
      setTokenHoldings(holdings);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [connected, publicKey, connection, toast]);

  const totalValue = solBalance * 150 + tokenHoldings.reduce((sum, token) => sum + token.value, 0); // Rough SOL price estimate

  return (
    <AppLayout showTrendingBar>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
                  Wallet
                </h1>
                <p className="text-sm text-muted-foreground">
                  {connected ? 'Manage your portfolio' : 'Connect to get started'}
                </p>
              </div>
              <div className="flex gap-2">
                {connected && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchWalletData}
                    disabled={loading}
                    className="h-11 w-11 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                <WalletMultiButton className="!bg-gradient-to-r !from-primary !to-primary/80 hover:!to-primary !h-11 !rounded-lg !font-semibold !shadow-lg !shadow-primary/25" />
              </div>
            </div>
          </div>

          {!connected ? (
            <Card className="p-16 text-center border-dashed border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <WalletIcon className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Connect your Phantom wallet to view your portfolio, track token prices, and execute trades
              </p>
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !h-12 !rounded-lg !font-semibold !px-8" />
            </Card>
          ) : (
            <>
              {/* Total Balance Card */}
              <Card className="p-8 mb-6 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 relative overflow-hidden shadow-xl">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
                
                <div className="relative">
                  <div className="text-center mb-8">
                    <p className="text-sm font-medium text-muted-foreground/80 mb-3 uppercase tracking-wide">
                      Total Portfolio Value
                    </p>
                    {loading ? (
                      <Skeleton className="h-20 w-80 mx-auto rounded-xl" />
                    ) : (
                      <div className="space-y-3">
                        <h2 className="text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                          ${totalValue.toFixed(2)}
                        </h2>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="text-sm font-semibold text-success">+12.5% today</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-background/60 backdrop-blur-xl rounded-xl border border-primary/10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.9 4.26L12 2L6.1 4.26L12 6.52L17.9 4.26Z" fill="white"/>
                          <path d="M17.9 9.74L12 12L6.1 9.74L12 11.48L17.9 9.74Z" fill="white"/>
                          <path d="M17.9 15.22L12 17.48L6.1 15.22L12 16.96L17.9 15.22Z" fill="white"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        {loading ? (
                          <Skeleton className="h-7 w-28" />
                        ) : (
                          <>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              SOL Balance
                            </p>
                            <p className="text-2xl font-bold text-foreground">{solBalance.toFixed(4)}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-background/60 backdrop-blur-xl rounded-xl border border-primary/10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                        <WalletIcon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        {loading ? (
                          <Skeleton className="h-7 w-28" />
                        ) : (
                          <>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              Tokens Held
                            </p>
                            <p className="text-2xl font-bold text-foreground">{tokenHoldings.length}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Token Holdings */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-2xl font-bold text-foreground">Token Holdings</h3>
                  {tokenHoldings.length > 0 && !loading && (
                    <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold">
                      {tokenHoldings.length} {tokenHoldings.length === 1 ? 'Token' : 'Tokens'}
                    </Badge>
                  )}
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-5 border-border/50">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-14 h-14 rounded-2xl" />
                          <div className="flex-1">
                            <Skeleton className="h-6 w-36 mb-2" />
                            <Skeleton className="h-4 w-28" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : tokenHoldings.length > 0 ? (
                  <div className="space-y-3">
                    {tokenHoldings.map((token) => {
                      const priceChange = Math.random() * 20 - 10;
                      const isPositive = priceChange >= 0;
                      
                      return (
                        <Card 
                          key={token.mint} 
                          className="p-5 border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group bg-gradient-to-br from-card to-card/50"
                        >
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-border/50 group-hover:ring-primary/40 transition-all">
                                <img 
                                  src={token.image} 
                                  alt={token.symbol}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/56?text=' + token.symbol.charAt(0);
                                  }}
                                />
                              </div>
                              {token.value > 100 && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-lg ring-2 ring-background">
                                  <CheckCircle className="w-3.5 h-3.5 text-success-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1.5">
                                <h4 className="font-bold text-foreground text-xl">{token.symbol}</h4>
                                <span className="text-xs text-muted-foreground truncate font-medium">
                                  {token.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground font-medium">
                                  {token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
                                </span>
                                <span className="text-border">•</span>
                                <span className="font-bold text-foreground">
                                  ${token.value.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-bold text-foreground text-lg mb-1.5">
                                ${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(4)}
                              </p>
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                                isPositive 
                                  ? 'bg-success/15 text-success border border-success/20' 
                                  : 'bg-destructive/15 text-destructive border border-destructive/20'
                              }`}>
                                {isPositive ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-success to-success/80 hover:to-success text-success-foreground font-bold px-5 h-10 shadow-lg shadow-success/25 group-hover:shadow-success/40 transition-all"
                                onClick={() => {
                                  setSelectedToken(token);
                                  setTradeAction('buy');
                                }}
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                                Buy
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-destructive/10 to-destructive/5 hover:from-destructive/20 hover:to-destructive/10 text-destructive border-2 border-destructive/30 hover:border-destructive/50 font-bold px-5 h-10 transition-all"
                                onClick={() => {
                                  setSelectedToken(token);
                                  setTradeAction('sell');
                                }}
                              >
                                <ArrowDownRight className="w-3.5 h-3.5 mr-1.5" />
                                Sell
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-16 text-center border-dashed border-2 border-muted bg-gradient-to-br from-card to-muted/20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <WalletIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">No tokens yet</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Your SPL token holdings will appear here once you acquire some tokens
                    </p>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
        <BottomNav />
      </div>

      {selectedToken && (
        <QuickTradeDrawer
          open={!!selectedToken}
          onOpenChange={(open) => !open && setSelectedToken(null)}
          type={tradeAction}
          token={{
            id: selectedToken.mint,
            symbol: selectedToken.symbol,
            name: selectedToken.name,
            price: selectedToken.price,
            change24h: 0,
            volume24h: 0,
            marketCap: 0,
            avatarUrl: selectedToken.image,
            chain: 'Solana',
            sparklineData: [],
            tags: [],
            liquidity: 0,
            description: '',
            likes: 0,
            comments: 0,
          }}
        />
      )}
    </AppLayout>
  );
}
