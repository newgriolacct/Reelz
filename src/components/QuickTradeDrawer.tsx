import { useState } from "react";
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

interface QuickTradeDrawerProps {
  token: Token;
  type: "buy" | "sell";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickTradeDrawer = ({ token, type, open, onOpenChange }: QuickTradeDrawerProps) => {
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState([1]);

  const estimatedTotal = amount ? parseFloat(amount) * token.price : 0;
  const estimatedFee = estimatedTotal * 0.003; // 0.3% fee

  const handleConfirm = () => {
    // TODO: Implement trade logic
    console.log(`${type} ${amount} ${token.symbol}`);
    onOpenChange(false);
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
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({token.symbol})</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount("1000")}
              >
                1K
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount("5000")}
              >
                5K
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount("10000")}
              >
                10K
              </Button>
            </div>
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
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Summary */}
          <div className="space-y-2 p-4 bg-secondary rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Total</span>
              <span className="font-medium">${estimatedTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="font-medium">${estimatedFee.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">You'll receive</span>
              <span className="font-bold">{amount || "0"} {token.symbol}</span>
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </DrawerClose>
          <Button
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
            className={
              type === "buy"
                ? "flex-1 bg-success hover:bg-success/90 text-success-foreground"
                : "flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }
          >
            Confirm {type === "buy" ? "Buy" : "Sell"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
