import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TokenCard } from "@/components/TokenCard";
import { searchTokens } from "@/services/dexscreener";
import { convertDexPairToToken } from "@/types/token";
import { Token } from "@/types/token";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const pairs = await searchTokens(debouncedSearch);
        // Filter for Solana tokens only
        const solanaPairs = pairs.filter(pair => pair.chainId.toLowerCase() === 'solana');
        const tokens = await Promise.all(solanaPairs.map(pair => convertDexPairToToken(pair)));
        setSearchResults(tokens.slice(0, 10)); // Limit to top 10 results
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  // Show selected token in full-screen card view
  if (selectedToken) {
    return (
      <AppLayout showTrendingBar={false}>
        {/* Back button */}
        <button
          onClick={() => setSelectedToken(null)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-secondary/90 backdrop-blur-sm hover:bg-secondary text-foreground rounded-lg border border-border flex items-center gap-2 transition-colors shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Search
        </button>
        <div className="h-[100dvh] overflow-y-auto bg-background pt-16">
          <TokenCard token={selectedToken} isEagerLoad />
        </div>
        <BottomNav />
      </AppLayout>
    );
  }

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
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
          )}
        </div>

        {/* Search Results */}
        {searchQuery ? (
          <div className="space-y-3">
            {isSearching ? (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Searching for "{searchQuery}"...</p>
                </div>
              </Card>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Found {searchResults.length} token{searchResults.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {searchResults.map((token) => (
                    <Card
                      key={token.id}
                      className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => setSelectedToken(token)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={token.avatarUrl}
                          alt={token.symbol}
                          className="w-10 h-10 rounded-full border-2 border-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{token.symbol}</span>
                            {token.isNew && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] px-1 py-0">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{token.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {token.contractAddress?.slice(0, 8)}...{token.contractAddress?.slice(-6)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">${token.price.toFixed(6)}</p>
                          <p
                            className={`text-sm font-semibold ${
                              token.change24h >= 0 ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {token.change24h >= 0 ? '+' : ''}
                            {token.change24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  No tokens found for "{searchQuery}"
                </p>
              </Card>
            )}
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
