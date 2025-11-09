import { Home, Search, Bell, User } from "lucide-react";
import { Button } from "./ui/button";

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 gap-1">
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </Button>
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 gap-1">
          <Search className="w-6 h-6" />
          <span className="text-xs">Discover</span>
        </Button>
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 gap-1">
          <Bell className="w-6 h-6" />
          <span className="text-xs">Alerts</span>
        </Button>
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2 gap-1">
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </Button>
      </div>
    </nav>
  );
};
