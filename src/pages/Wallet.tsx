import { Wallet as WalletIcon, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
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
              // If API fails, show token with basic info
              holdings.push({
                mint,
                symbol: 'UNKNOWN',
                name: 'Unknown Token',
                image: 'https://via.placeholder.com/40',
                balance,
                price: 0,
                value: 0,
              });
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
          description: "Failed to fetch wallet data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [connected, publicKey, connection, toast]);

  const totalValue = solBalance * 150 + tokenHoldings.reduce((sum, token) => sum + token.value, 0); // Rough SOL price estimate

  return (
    <AppLayout showTrendingBar>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
              <p className="text-muted-foreground">
                {connected ? 'Your Phantom wallet is connected' : 'Connect your Phantom wallet to start trading'}
              </p>
            </div>
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
          </div>

          {!connected ? (
            <Card className="p-12 text-center">
              <WalletIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No wallet connected
              </h2>
              <p className="text-muted-foreground mb-6">
                Connect your Phantom wallet to view your portfolio and trade tokens
              </p>
            </Card>
          ) : (
            <>
              {/* Total Balance Card */}
              <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
                  {loading ? (
                    <Skeleton className="h-12 w-48 mx-auto" />
                  ) : (
                    <h2 className="text-4xl font-bold text-foreground mb-4">
                      ${totalValue.toFixed(2)}
                    </h2>
                  )}
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://cryptologos.cc/logos/solana-sol-logo.png" 
                        alt="SOL" 
                        className="w-5 h-5"
                      />
                      {loading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        <span className="font-semibold">{solBalance.toFixed(4)} SOL</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Token Holdings */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Token Holdings</h3>
                
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : tokenHoldings.length > 0 ? (
                  <div className="space-y-3">
                    {tokenHoldings.map((token) => {
                      const priceChange = Math.random() * 20 - 10; // Mock change
                      const isPositive = priceChange >= 0;
                      
                      return (
                        <Card key={token.mint} className="p-4 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <img 
                              src={token.image} 
                              alt={token.symbol}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/40';
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{token.symbol}</h4>
                                <span className="text-xs text-muted-foreground">{token.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} tokens
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="font-medium text-foreground">
                                  ${token.value.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground mb-1">
                                ${token.price.toFixed(6)}
                              </p>
                              <div className="flex items-center gap-1 justify-end">
                                {isPositive ? (
                                  <TrendingUp className="w-3 h-3 text-success" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-destructive" />
                                )}
                                <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
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
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No token holdings found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your SPL tokens will appear here
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
