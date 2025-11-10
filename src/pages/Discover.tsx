import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppLayout showTrendingBar>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
          <p className="text-muted-foreground">Search tokens by name, symbol, or contract address</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Search Results / Placeholder */}
        {searchQuery ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Searching for "{searchQuery}"...
            </p>
            <Card className="p-4">
              <p className="text-center text-muted-foreground">
                Search functionality will be implemented soon
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {["Bitcoin", "Ethereum", "Solana", "Pepe", "Bonk", "Dogecoin"].map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSearchQuery(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        </div>
        <BottomNav />
      </div>
    </AppLayout>
  );
}
