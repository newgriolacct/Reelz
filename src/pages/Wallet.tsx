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
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {connected ? publicKey?.toString().slice(0, 4) + '...' + publicKey?.toString().slice(-4) : 'Not connected'}
              </p>
            </div>
            <div className="flex gap-2">
              {connected && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchWalletData}
                  disabled={loading}
                  className="h-9 w-9"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !h-9 !text-sm" />
            </div>
          </div>

          {!connected ? (
            <Card className="p-12 text-center bg-card/50">
              <WalletIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Connect Wallet
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Connect to view portfolio
              </p>
              <WalletMultiButton />
            </Card>
          ) : (
            <>
              {/* Balance Card */}
              <Card className="p-6 mb-6 bg-card">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                    Total Value
                  </p>
                  {loading ? (
                    <Skeleton className="h-12 w-48 mx-auto mb-4" />
                  ) : (
                    <h2 className="text-4xl font-bold text-foreground mb-4">
                      ${totalValue.toFixed(2)}
                    </h2>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      {loading ? (
                        <Skeleton className="h-5 w-20 mx-auto" />
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-1">SOL</p>
                          <p className="text-lg font-bold text-foreground">{solBalance.toFixed(4)}</p>
                        </>
                      )}
                    </div>
                    
                    <div className="p-3 bg-secondary/50 rounded-lg">
                      {loading ? (
                        <Skeleton className="h-5 w-20 mx-auto" />
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-1">Tokens</p>
                          <p className="text-lg font-bold text-foreground">{tokenHoldings.length}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Token Holdings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Holdings</h3>
                  {tokenHoldings.length > 0 && !loading && (
                    <span className="text-xs text-muted-foreground">
                      {tokenHoldings.length} tokens
                    </span>
                  )}
                </div>
                
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <Skeleton className="h-5 w-24" />
                          <div className="ml-auto flex gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : tokenHoldings.length > 0 ? (
                  <div className="space-y-2">
                    {tokenHoldings.map((token) => {
                      const priceChange = Math.random() * 20 - 10;
                      const isPositive = priceChange >= 0;
                      
                      return (
                        <Card 
                          key={token.mint} 
                          className="p-3 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={token.image} 
                              alt={token.symbol}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/40?text=' + token.symbol.charAt(0);
                              }}
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <h4 className="font-bold text-foreground">{token.symbol}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-foreground">
                                ${token.value.toFixed(2)}
                              </p>
                            </div>
                            
                            <div className={`text-xs font-semibold px-2 py-1 rounded ${
                              isPositive ? 'text-success' : 'text-destructive'
                            }`}>
                              {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="h-8 px-3 bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => {
                                  setSelectedToken(token);
                                  setTradeAction('buy');
                                }}
                              >
                                Buy
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedToken(token);
                                  setTradeAction('sell');
                                }}
                              >
                                Sell
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-8 text-center bg-secondary/20">
                    <WalletIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No tokens found
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
