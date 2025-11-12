import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export const WelcomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup before
    const hasSeenPopup = localStorage.getItem("hasSeenWelcomePopup");
    
    if (!hasSeenPopup) {
      // Show popup after a short delay
      setTimeout(() => {
        setIsVisible(true);
      }, 800);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("hasSeenWelcomePopup", "true");
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm animate-scale-in">
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/30 rounded-2xl p-8 shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center space-y-6">
            <div className="text-6xl animate-bounce">
              👋
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Welcome!
              </h2>
              <p className="text-muted-foreground text-sm">
                Discover trending tokens by scrolling down
              </p>
            </div>

            {/* Animated scroll indicator */}
            <div className="flex flex-col items-center gap-2 py-4">
              <ChevronDown className="w-8 h-8 text-primary animate-bounce" />
              <ChevronDown className="w-8 h-8 text-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
              <ChevronDown className="w-8 h-8 text-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Got it! 🚀
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
