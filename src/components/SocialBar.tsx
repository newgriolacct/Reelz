import { Send, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const SocialBar = () => {
  const { toast } = useToast();
  const contractAddress = "GzDuyMUMLnCWDteDcqDdUbG7qznVo9UoXZDBa6yqpump";
  const truncatedAddress = `${contractAddress.slice(0, 4)}...${contractAddress.slice(-4)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    toast({
      title: "Copied!",
      description: "Contract address copied to clipboard",
    });
  };

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
        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <span className="hidden sm:inline">$RLZ: </span>
          <span className="font-mono">{truncatedAddress}</span>
          <Copy size={12} />
        </button>
      </div>
    </div>
  );
};
