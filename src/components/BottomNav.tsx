import { Home, Search, Heart, Wallet } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/40 shadow-lg">
      <div className="flex items-center justify-around h-20 max-w-md mx-auto px-4">
        <NavLink 
          to="/" 
          className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl transition-all duration-200 hover:bg-accent/50"
          activeClassName="bg-primary/10 text-primary"
        >
          {({ isActive }) => (
            <>
              <Home className={cn("w-6 h-6 transition-all", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">Home</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/discover" 
          className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl transition-all duration-200 hover:bg-accent/50"
          activeClassName="bg-primary/10 text-primary"
        >
          {({ isActive }) => (
            <>
              <Search className={cn("w-6 h-6 transition-all", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">Discover</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/favorites" 
          className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl transition-all duration-200 hover:bg-accent/50"
          activeClassName="bg-primary/10 text-primary"
        >
          {({ isActive }) => (
            <>
              <Heart className={cn("w-6 h-6 transition-all", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">Favorites</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/wallet" 
          className="flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl transition-all duration-200 hover:bg-accent/50"
          activeClassName="bg-primary/10 text-primary"
        >
          {({ isActive }) => (
            <>
              <Wallet className={cn("w-6 h-6 transition-all", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">Wallet</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
