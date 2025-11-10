import { Heart } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";

export default function Favorites() {
  return (
    <AppLayout showTrendingBar>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Favorites</h1>
          <p className="text-muted-foreground">Your saved tokens and watchlist</p>
        </div>

        {/* Empty State */}
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No favorites yet
          </h2>
          <p className="text-muted-foreground">
            Start adding tokens to your favorites to see them here
          </p>
        </Card>
        </div>
        <BottomNav />
      </div>
    </AppLayout>
  );
}
