import { Wallet as WalletIcon, CheckCircle, TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { CustomWalletButton } from "@/components/CustomWalletButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Skeleton } from "@/components/ui/skeleton";
import { QuickTradeDrawer } from "@/components/QuickTradeDrawer";
import { formatDistanceToNow } from "date-fns";

interface TokenHolding {
  mint: string;
  symbol: string;
  name: string;
  image: string;
  balance: number;
  price: number;
  value: number;
}

interface Transaction {
  id: string;
  token_symbol: string;
  token_name: string;
  transaction_type: 'buy' | 'sell';
  amount: number;
  price_per_token: number;
  total_value: number;
  signature: string;
  created_at: string;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

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

  const fetchTransactions = async () => {
    if (!connected || !publicKey) return;
    
    setLoadingTransactions(true);
    try {
      const walletAddress = publicKey.toString();
      
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (profile) {
        const { data, error } = await supabase
          .from('transactions' as any)
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        if (data) {
          setTransactions(data.map((tx: any) => ({
            id: tx.id,
            token_symbol: tx.token_symbol,
            token_name: tx.token_name,
            transaction_type: tx.transaction_type as 'buy' | 'sell',
            amount: tx.amount,
            price_per_token: tx.price_per_token,
            total_value: tx.total_value,
            signature: tx.signature,
            created_at: tx.created_at,
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [connected, publicKey]);

  const totalValue = solBalance * 150 + tokenHoldings.reduce((sum, token) => sum + token.value, 0); // Rough SOL price estimate

  return (
    <AppLayout showTrendingBar>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
              <div className="flex gap-2">
                {connected && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchWalletData}
                    disabled={loading}
                    className="h-10 w-10"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                <CustomWalletButton className="h-10 text-sm" />
              </div>
            </div>
            {connected && (
              <div className="text-xs font-mono text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2 inline-block">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </div>
            )}
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
              <CustomWalletButton />
            </Card>
          ) : (
            <>
              {/* Balance Card */}
              <Card className="p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Portfolio</p>
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <h2 className="text-2xl font-bold text-foreground">
                        ${totalValue.toFixed(2)}
                      </h2>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">SOL Balance</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-bold text-foreground">{solBalance.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">SOL</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Token Holdings */}
              <Tabs defaultValue="holdings" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="holdings">Holdings</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="holdings">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Your Tokens</h3>
                    {tokenHoldings.length > 0 && !loading && (
                      <span className="text-xs text-muted-foreground">
                        {tokenHoldings.length} tokens
                      </span>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-3">
                          <div className="flex items-start gap-3">
                            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <Skeleton className="h-5 w-20 mb-1" />
                              <Skeleton className="h-4 w-16 mb-3" />
                              <div className="flex gap-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                              </div>
                            </div>
                            <Skeleton className="h-6 w-20" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : tokenHoldings.length > 0 ? (
                    <div className="space-y-2.5">
                      {tokenHoldings.map((token) => (
                        <Card 
                          key={token.mint} 
                          className="p-3 hover:bg-accent/5 transition-all border-border/40"
                        >
                          <div className="flex items-start gap-3">
                            <img 
                              src={token.image} 
                              alt={token.symbol}
                              className="w-12 h-12 rounded-full ring-2 ring-border/20 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/48?text=' + token.symbol.charAt(0);
                              }}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <h4 className="font-bold text-base text-foreground leading-tight">{token.symbol}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <p className="text-base font-bold text-foreground whitespace-nowrap ml-2">
                                  ${token.value.toFixed(2)}
                                </p>
                              </div>
                              
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  className="h-8 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
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
                                  className="h-8 flex-1 text-xs"
                                  onClick={() => {
                                    setSelectedToken(token);
                                    setTradeAction('sell');
                                  }}
                                >
                                  Sell
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center bg-secondary/20">
                      <WalletIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No tokens found
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="transactions">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
                    {transactions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchTransactions}
                        disabled={loadingTransactions}
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>

                  {loadingTransactions ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-3">
                          <Skeleton className="h-16 w-full" />
                        </Card>
                      ))}
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-2.5">
                      {transactions.map((tx) => (
                        <Card 
                          key={tx.id} 
                          className="p-3 hover:bg-accent/5 transition-all border-border/40"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              tx.transaction_type === 'buy' 
                                ? 'bg-success/10' 
                                : 'bg-destructive/10'
                            }`}>
                              {tx.transaction_type === 'buy' ? (
                                <ArrowDownRight className="w-5 h-5 text-success" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-destructive" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm text-foreground">
                                      {tx.transaction_type === 'buy' ? 'Bought' : 'Sold'} {tx.token_symbol}
                                    </h4>
                                    <Badge 
                                      variant={tx.transaction_type === 'buy' ? 'default' : 'outline'}
                                      className={`text-[10px] ${
                                        tx.transaction_type === 'buy' 
                                          ? 'bg-success text-success-foreground' 
                                          : 'text-destructive border-destructive'
                                      }`}
                                    >
                                      {tx.transaction_type.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} @ ${Number(tx.price_per_token).toFixed(6)}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-foreground whitespace-nowrap ml-2">
                                  ${Number(tx.total_value).toFixed(2)}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, '_blank')}
                                >
                                  View Tx
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center bg-secondary/20">
                      <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No transactions yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start buying or selling tokens to see your transaction history
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
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
            contractAddress: selectedToken.mint,
          }}
        />
      )}
    </AppLayout>
  );
}
