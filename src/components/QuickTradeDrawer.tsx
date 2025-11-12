import { useState, useEffect } from "react";
import { Token } from "@/types/token";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getQuote, executeSwap, SOL_MINT, getTokenDecimals, getTokenBalance } from "@/services/jupiter";
import { toast } from "sonner";
import { Loader2, ExternalLink, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuickTradeDrawerProps {
  token: Token;
  type: "buy" | "sell";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickTradeDrawer = ({ token, type, open, onOpenChange }: QuickTradeDrawerProps) => {
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState([0.5]); // Default to 0.5% slippage
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [decimals, setDecimals] = useState(9);
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  const { connection } = useConnection();
  const wallet = useWallet();

  // Fetch token decimals and balance
  useEffect(() => {
    if (open && token.contractAddress && wallet.publicKey) {
      getTokenDecimals(connection, token.contractAddress).then(setDecimals);
      
      // Fetch balance for the appropriate token
      setLoadingBalance(true);
      const mintAddress = type === "buy" ? SOL_MINT : token.contractAddress;
      getTokenBalance(connection, wallet.publicKey.toString(), mintAddress)
        .then(setBalance)
        .finally(() => setLoadingBalance(false));
    }
  }, [open, token.contractAddress, connection, wallet.publicKey, type]);

  // Fetch quote when amount or slippage changes
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || !open || !token.contractAddress) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      try {
        const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, type === "buy" ? 9 : decimals));
        
        const inputMint = type === "buy" ? SOL_MINT : token.contractAddress!;
        const outputMint = type === "buy" ? token.contractAddress! : SOL_MINT;
        const slippageBps = slippage[0] * 100; // Convert percentage to basis points

        console.log("Fetching quote:", { inputMint, outputMint, amountInSmallestUnit, slippageBps });

        const quoteResponse = await getQuote(
          inputMint,
          outputMint,
          amountInSmallestUnit,
          slippageBps
        );

        console.log("Quote received:", quoteResponse);
        setQuote(quoteResponse);
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        toast.error("Failed to get quote. Please try again.");
        setQuote(null);
      }
    };

    const debounceTimer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [amount, slippage, type, token.contractAddress, decimals, open]);

  const handlePercentageClick = (percentage: number) => {
    if (balance > 0) {
      const calculatedAmount = (balance * percentage).toFixed(6);
      setAmount(calculatedAmount);
    }
  };

  const estimatedOutput = quote ?
    (parseInt(quote.outAmount) / Math.pow(10, type === "buy" ? decimals : 9)).toFixed(6) : 
    "0";

  const priceImpact = quote?.priceImpactPct ? (quote.priceImpactPct * 100).toFixed(2) : "0";

  const handleConfirm = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!quote) {
      toast.error("No quote available");
      return;
    }

    setIsLoading(true);

    try {
      const signature = await executeSwap(connection, wallet, quote);
      
      // Record transaction in database
      try {
        const walletAddress = wallet.publicKey.toString();
        
        // Get or create profile
        let { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress)
          .maybeSingle();

        if (!profile) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert([{ wallet_address: walletAddress }])
            .select()
            .maybeSingle();
          profile = newProfile;
        }

        if (profile) {
          // Calculate transaction details
          const inputAmount = parseFloat(amount);
          const outputAmount = parseInt(quote.outAmount) / Math.pow(10, type === "buy" ? decimals : 9);
          const pricePerToken = type === "buy" 
            ? inputAmount / outputAmount 
            : outputAmount / inputAmount;
          const totalValue = type === "buy" ? inputAmount : outputAmount;

          await supabase
            .from('transactions' as any)
            .insert([{
              profile_id: profile.id,
              token_id: token.contractAddress || token.id,
              token_symbol: token.symbol,
              token_name: token.name,
              transaction_type: type,
              amount: type === "buy" ? outputAmount : inputAmount,
              price_per_token: pricePerToken,
              total_value: totalValue,
              signature: signature,
            }]);
        }
      } catch (dbError) {
        console.error("Failed to record transaction:", dbError);
        // Don't fail the whole operation if DB insert fails
      }
      
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Transaction successful!</p>
          <a 
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 text-primary hover:underline"
          >
            View on Solscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
      
      onOpenChange(false);
      setAmount("");
    } catch (error: any) {
      console.error("Swap failed:", error);
      toast.error(error.message || "Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border">
        <DrawerHeader>
          <DrawerTitle className="text-2xl">
            {type === "buy" ? "Buy" : "Sell"} {token.symbol}
          </DrawerTitle>
          <DrawerDescription>
            Current price: ${token.price.toFixed(6)}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Wallet Status */}
          {!wallet.connected && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning">
              Please connect your wallet to trade
            </div>
          )}

          {/* Balance Display */}
          {wallet.connected && (
            <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="text-sm font-semibold ml-auto">
                {loadingBalance ? (
                  "Loading..."
                ) : (
                  `${balance.toFixed(6)} ${type === "buy" ? "SOL" : token.symbol}`
                )}
              </span>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount ({type === "buy" ? "SOL" : token.symbol})
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
              disabled={!wallet.connected || isLoading}
            />
            {type === "sell" ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(0.25)}
                  disabled={!wallet.connected || isLoading || balance === 0}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(0.5)}
                  disabled={!wallet.connected || isLoading || balance === 0}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(0.75)}
                  disabled={!wallet.connected || isLoading || balance === 0}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(1)}
                  disabled={!wallet.connected || isLoading || balance === 0}
                >
                  MAX
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount("0.1")}
                  disabled={!wallet.connected || isLoading}
                >
                  0.1 SOL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount("0.5")}
                  disabled={!wallet.connected || isLoading}
                >
                  0.5 SOL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount("1")}
                  disabled={!wallet.connected || isLoading}
                >
                  1 SOL
                </Button>
              </div>
            )}
          </div>

          {/* Slippage */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Slippage Tolerance</Label>
              <span className="text-sm text-muted-foreground">{slippage[0]}%</span>
            </div>
            <Slider
              value={slippage}
              onValueChange={setSlippage}
              min={0.1}
              max={20}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Summary */}
          <div className="space-y-2 p-4 bg-secondary rounded-lg">
            {quote ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You'll receive</span>
                  <span className="font-bold">
                    {estimatedOutput} {type === "buy" ? token.symbol : "SOL"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className={`font-medium ${parseFloat(priceImpact) > 1 ? 'text-warning' : ''}`}>
                    {priceImpact}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum Received</span>
                  <span className="font-medium text-xs">
                    {(parseInt(quote.otherAmountThreshold) / Math.pow(10, type === "buy" ? decimals : 9)).toFixed(6)} {type === "buy" ? token.symbol : "SOL"}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-2">
                {amount ? "Fetching quote..." : "Enter an amount to see quote"}
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
          </DrawerClose>
          <Button
            onClick={handleConfirm}
            disabled={!wallet.connected || !amount || parseFloat(amount) <= 0 || !quote || isLoading}
            className={
              type === "buy"
                ? "flex-1 bg-success hover:bg-success/90 text-success-foreground"
                : "flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm ${type === "buy" ? "Buy" : "Sell"}`
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
