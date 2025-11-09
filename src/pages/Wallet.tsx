import { Wallet as WalletIcon, Plus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Wallet() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
          <p className="text-muted-foreground">Connect your wallet to start trading</p>
        </div>

        {/* Wallet Connection */}
        <Card className="p-12 text-center">
          <WalletIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No wallet connected
          </h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your portfolio and trade tokens
          </p>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Connect Wallet
          </Button>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
