import { Heart, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTokenFavorites } from "@/hooks/useTokenFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const { favorites, loading, removeFavorite } = useTokenFavorites();
  const navigate = useNavigate();

  const handleRemove = async (tokenId: string) => {
    await removeFavorite(tokenId);
  };

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
              {favorites.map((favorite) => (
                <Card 
                  key={favorite.id} 
                  className="p-4 hover:bg-accent/5 transition-all border-border/40"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={favorite.token_image || `https://api.dicebear.com/7.x/shapes/svg?seed=${favorite.token_symbol}`} 
                      alt={favorite.token_symbol}
                      className="w-12 h-12 rounded-full ring-2 ring-border/20"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${favorite.token_symbol}`;
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base text-foreground">{favorite.token_symbol}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {favorite.token_name}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {favorite.token_chain}
                        </p>
                      </div>
                    </div>
                    
                    {favorite.token_price && (
                      <div className="text-right mr-2">
                        <p className="text-base font-bold text-foreground">
                          ${Number(favorite.token_price).toFixed(6)}
                        </p>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(favorite.token_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </AppLayout>
  );
}
