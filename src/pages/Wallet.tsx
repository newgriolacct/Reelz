import { Wallet as WalletIcon, CheckCircle } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    const createProfile = async () => {
      if (connected && publicKey) {
        try {
          const walletAddress = publicKey.toString();
          
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

          if (!existingProfile) {
            // Create new profile
            const { error } = await supabase
              .from('profiles')
              .insert([{ wallet_address: walletAddress }]);

            if (error) {
              console.error('Error creating profile:', error);
              toast({
                title: "Error",
                description: "Failed to create profile",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Success",
                description: "Wallet connected and profile created!",
              });
            }
          } else {
            toast({
              title: "Welcome back!",
              description: "Wallet connected successfully",
            });
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    createProfile();
  }, [connected, publicKey, toast]);

  return (
    <AppLayout showTrendingBar>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
            <p className="text-muted-foreground">
              {connected ? 'Your Phantom wallet is connected' : 'Connect your Phantom wallet to start trading'}
            </p>
          </div>

          {/* Wallet Connection */}
          <Card className="p-12 text-center">
            {connected ? (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Wallet Connected
                </h2>
                <p className="text-muted-foreground mb-4 break-all">
                  {publicKey?.toString()}
                </p>
                <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
              </>
            ) : (
              <>
                <WalletIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No wallet connected
                </h2>
                <p className="text-muted-foreground mb-6">
                  Connect your Phantom wallet to view your portfolio and trade tokens
                </p>
                <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
              </>
            )}
          </Card>
        </div>
        <BottomNav />
      </div>
    </AppLayout>
  );
}
