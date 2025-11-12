import { MessageCircle, Twitter } from "lucide-react";

export const SocialBar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <a
            href="https://t.me/reelzchat"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Telegram</span>
          </a>
          <a
            href="https://x.com/Reelzdotfi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Twitter size={16} />
            <span className="hidden sm:inline">Twitter</span>
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
