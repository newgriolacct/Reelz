import { BottomNav } from "@/components/BottomNav";
import { Wallet as WalletIcon, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Wallet = () => {
  const walletAddress = "0x1234...5678"; // Mock wallet address

  return (
    <div className="min-h-screen bg-background pt-16 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <WalletIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
        </div>
        
        <div className="space-y-6">
          {/* Wallet Card */}
          <div className="bg-gradient-to-br from-primary to-primary/70 rounded-xl p-6 text-primary-foreground">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Balance</p>
                <h2 className="text-3xl font-bold">$0.00</h2>
              </div>
              <WalletIcon className="w-8 h-8 opacity-90" />
            </div>
            
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3 mt-4">
              <span className="text-sm font-mono flex-1">{walletAddress}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground hover:bg-white/20">
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground hover:bg-white/20">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Connect Wallet Section */}
          <div className="bg-secondary rounded-xl p-6 text-center">
            <WalletIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Web3 wallet to start trading
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Connect Wallet
            </Button>
          </div>

          {/* Recent Transactions */}
          <div className="bg-secondary rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Wallet;
