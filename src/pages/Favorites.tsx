import { BottomNav } from "@/components/BottomNav";
import { Heart } from "lucide-react";

const Favorites = () => {
  return (
    <div className="min-h-screen bg-background pt-16 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Favorites</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No favorites yet</h2>
          <p className="text-muted-foreground text-center">
            Start adding tokens to your favorites to track them here
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Favorites;
