import { Heart, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTokenFavorites } from "@/hooks/useTokenFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { formatPrice, formatNumber } from "@/lib/formatters";

interface TokenHolding {
  mint: string;
  balance: number;
  value: number;
}

export default function Favorites() {
  const { favorites, loading, removeFavorite } = useTokenFavorites();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [holdings, setHoldings] = useState<Map<string, TokenHolding>>(new Map());
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Map<string, { price: number; change24h: number }>>(new Map());

  const handleRemove = async (tokenId: string) => {
    await removeFavorite(tokenId);
  };

  useEffect(() => {
    const fetchWalletHoldings = async () => {
      if (!connected || !publicKey) {
        setHoldings(new Map());
        return;
      }

      setLoadingHoldings(true);
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );

        const holdingsMap = new Map<string, TokenHolding>();
        for (const { account } of tokenAccounts.value) {
          const parsedInfo = account.data.parsed.info;
          const mint = parsedInfo.mint;
          const balance = parsedInfo.tokenAmount.uiAmount;

          if (balance > 0) {
            holdingsMap.set(mint, {
              mint,
              balance,
              value: 0, // Will be calculated with price
            });
          }
        }
        setHoldings(holdingsMap);
      } catch (error) {
        console.error('Error fetching wallet holdings:', error);
      } finally {
        setLoadingHoldings(false);
      }
    };

    fetchWalletHoldings();
  }, [connected, publicKey, connection]);

  useEffect(() => {
    const fetchTokenPrices = async () => {
      if (!favorites || favorites.length === 0) {
        setTokenPrices(new Map());
        return;
      }

      const pricesMap = new Map<string, { price: number; change24h: number }>();
      
      // Initialize with saved prices from database as fallback
      favorites.forEach(favorite => {
        if (favorite.token_price) {
          pricesMap.set(favorite.token_id, {
            price: favorite.token_price,
            change24h: 0, // No change data for saved prices
          });
        }
      });
      
      // Fetch all prices in parallel
      const pricePromises = favorites.map(async (favorite) => {
        try {
          const response = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${favorite.token_id}`
          );
          const data = await response.json();
          
          if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            return {
              tokenId: favorite.token_id,
              price: parseFloat(pair.priceUsd) || 0,
              change24h: pair.priceChange?.h24 || 0,
            };
          }
        } catch (err) {
          console.error(`Failed to fetch price for ${favorite.token_id}:`, err);
        }
        return null;
      });

      const results = await Promise.all(pricePromises);
      
      // Update with live prices where available
      results.forEach(result => {
        if (result && result.price > 0) {
          pricesMap.set(result.tokenId, {
            price: result.price,
            change24h: result.change24h,
          });
        }
      });
      
      setTokenPrices(pricesMap);
    };

    fetchTokenPrices();
  }, [favorites]);

  // Update holdings values when prices change
  useEffect(() => {
    if (holdings.size === 0 || tokenPrices.size === 0) return;

    const updatedHoldings = new Map(holdings);
    let updated = false;
    
    updatedHoldings.forEach((holding, mint) => {
      const priceData = tokenPrices.get(mint);
      if (priceData && holding.value === 0) {
        holding.value = holding.balance * priceData.price;
        updated = true;
      }
    });

    if (updated) {
      setHoldings(new Map(updatedHoldings));
    }
  }, [tokenPrices, holdings]);

  return (
    <AppLayout showTrendingBar>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Favorites</h1>
            <p className="text-muted-foreground">
              {favorites.length > 0 ? `${favorites.length} saved tokens` : 'Your saved tokens and watchlist'}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No favorites yet
              </h2>
              <p className="text-muted-foreground">
                Start adding tokens to your favorites to see them here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {favorites.map((favorite) => {
                const priceData = tokenPrices.get(favorite.token_id);
                const holding = holdings.get(favorite.token_id);
                const isPositive = (priceData?.change24h || 0) >= 0;

                return (
                  <Card 
                    key={favorite.id} 
                    className="p-4 hover:bg-accent/5 transition-all border-border/40"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={favorite.token_image || `https://api.dicebear.com/7.x/shapes/svg?seed=${favorite.token_symbol}`} 
                        alt={favorite.token_symbol}
                        className="w-12 h-12 rounded-full ring-2 ring-border/20 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${favorite.token_symbol}`;
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-base text-foreground">{favorite.token_symbol}</h4>
                          {holding && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 bg-primary/10 border-primary/20">
                              <Wallet className="h-3 w-3" />
                              Holding
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="truncate">{favorite.token_name}</span>
                          <span>•</span>
                          <span>{favorite.token_chain}</span>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {priceData ? formatPrice(priceData.price) : (favorite.token_price ? formatPrice(favorite.token_price) : '$0.00')}
                            </p>
                          </div>
                          {priceData && priceData.change24h !== 0 && (
                            <div className={`flex items-center gap-1 text-xs font-semibold ${
                              isPositive ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {isPositive ? '+' : ''}{priceData.change24h.toFixed(2)}%
                            </div>
                          )}
                        </div>

                        {holding && (
                          <div className="bg-secondary/30 rounded-lg p-2.5 mt-2">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-muted-foreground mb-0.5">Balance</p>
                                <p className="font-bold text-foreground">
                                  {formatNumber(holding.balance)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-0.5">Value</p>
                                <p className="font-bold text-foreground">
                                  {priceData 
                                    ? `$${formatNumber(holding.balance * priceData.price)}` 
                                    : (favorite.token_price ? `$${formatNumber(holding.balance * favorite.token_price)}` : '$0.00')
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => handleRemove(favorite.token_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </AppLayout>
  );
}
