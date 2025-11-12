import { Send } from "lucide-react";

export const SocialBar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-1.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <a
            href="https://t.me/reelzchat"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Send size={14} />
            <span>Telegram</span>
          </a>
          <a
            href="https://x.com/Reelzdotfi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>X</span>
          </a>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">$RLZ: </span>
          <span className="text-warning">Coming Soon</span>
        </div>
      </div>
    </div>
  );
};
