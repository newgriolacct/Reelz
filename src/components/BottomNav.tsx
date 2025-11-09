import { Home, Search, Heart, Wallet } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-card via-card to-card/95 backdrop-blur-2xl border-t border-border/30">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-6">
        <NavLink 
          to="/" 
          className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all duration-300 hover:scale-105 text-muted-foreground"
          activeClassName="text-primary scale-105"
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "transition-all duration-300",
                isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              )}>
                <Home className={cn("w-5 h-5", isActive && "fill-primary")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>Home</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/discover" 
          className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all duration-300 hover:scale-105 text-muted-foreground"
          activeClassName="text-primary scale-105"
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "transition-all duration-300",
                isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              )}>
                <Search className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>Discover</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/favorites" 
          className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all duration-300 hover:scale-105 text-muted-foreground"
          activeClassName="text-primary scale-105"
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "transition-all duration-300",
                isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              )}>
                <Heart className={cn("w-5 h-5", isActive && "fill-primary")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>Favorites</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/wallet" 
          className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all duration-300 hover:scale-105 text-muted-foreground"
          activeClassName="text-primary scale-105"
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "transition-all duration-300",
                isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
              )}>
                <Wallet className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>Wallet</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
