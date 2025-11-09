import { Home, Search, Heart, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </NavLink>
        
        <NavLink
          to="/discover"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Search className="w-6 h-6" />
          <span className="text-xs">Discover</span>
        </NavLink>
        
        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Heart className="w-6 h-6" />
          <span className="text-xs">Favorites</span>
        </NavLink>
        
        <NavLink
          to="/wallet"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Wallet className="w-6 h-6" />
          <span className="text-xs">Wallet</span>
        </NavLink>
      </div>
    </nav>
  );
};
