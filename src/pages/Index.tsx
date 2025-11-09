import { TokenCard } from "@/components/TokenCard";
import { BottomNav } from "@/components/BottomNav";
import { TrendingTokensList } from "@/components/TrendingTokensList";
import { NetworkSelector } from "@/components/NetworkSelector";
import { fetchAggregatedTrending, fetchAggregatedRandom } from "@/services/tokenAggregator";
import { useEffect, useState, useRef, useCallback } from "react";
import { Token } from "@/types/token";

const Index = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTokenId, setCurrentTokenId] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [seenTokenIds, setSeenTokenIds] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const tokensRef = useRef<Token[]>([]);

  const loadMoreTokens = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    
    try {
      const convertedTokens = await fetchAggregatedRandom(selectedNetwork);
      
      // Filter out tokens we've already seen
      setSeenTokenIds(prev => {
        const newTokens = convertedTokens.filter(token => !prev.has(token.id));
        
        if (newTokens.length > 0) {
          setTokens(currentTokens => {
            const updated = [...currentTokens, ...newTokens];
            tokensRef.current = updated;
            return updated;
          });
          return new Set([...prev, ...newTokens.map(t => t.id)]);
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to load more tokens', err);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setError(null);
        
        // INSTANT: Clear old tokens immediately when network changes
        setTokens([]);
        setTrendingTokens([]);
        setSeenTokenIds(new Set());
        setLoading(true);
        
        // Load both trending and random in parallel
        const [convertedRandom, convertedTrending] = await Promise.all([
          fetchAggregatedRandom(selectedNetwork, true), // Reset offset when network changes
          fetchAggregatedTrending(selectedNetwork)
        ]);
        
        console.log(`Loaded ${convertedRandom.length} tokens for ${selectedNetwork}`);
        
        tokensRef.current = convertedRandom;
        setTokens(convertedRandom);
        setTrendingTokens(convertedTrending);
        setSeenTokenIds(new Set(convertedRandom.map(t => t.id)));
        
        if (convertedRandom.length > 0) {
          setCurrentTokenId(convertedRandom[0].id);
        }
        
        setLoading(false);
        
        // Scroll to top when network changes
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
      } catch (err) {
        console.error('Failed to load tokens:', err);
        setError('Failed to load tokens');
        setLoading(false);
      }
    };

    loadTokens();
  }, [selectedNetwork]);

  // Track current token on scroll and load more
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const currentTokens = tokensRef.current;
        if (currentTokens.length === 0) return;
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const windowHeight = window.innerHeight;
        
        // Update current token
        const currentIndex = Math.round(scrollTop / windowHeight);
        if (currentTokens[currentIndex]) {
          setCurrentTokenId(currentTokens[currentIndex].id);
        }
        
        // Load more when 5 tokens away from bottom - smooth infinite scroll
        const tokensFromBottom = (scrollHeight - scrollTop - clientHeight) / windowHeight;
        if (tokensFromBottom < 5 && !isLoadingMoreRef.current) {
          console.log('Loading more tokens...');
          loadMoreTokens();
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [loadMoreTokens]);

  const handleTokenClick = (tokenId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if token is in the scrolling feed
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    
    if (tokenIndex !== -1) {
      // Token exists in feed, scroll to it
      container.scrollTo({
        top: tokenIndex * window.innerHeight,
        behavior: 'smooth'
      });
    } else {
      // Token is from trending bar but not in feed yet
      // Find it in trending tokens and add it to the top of the feed
      const trendingToken = trendingTokens.find(t => t.id === tokenId);
      if (trendingToken) {
        setTokens(prev => [trendingToken, ...prev]);
        setSeenTokenIds(prev => new Set([...prev, tokenId]));
        // Scroll to top after a short delay to let React update
        setTimeout(() => {
          container.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  };

  const handleLike = (tokenId: string) => {
    console.log("Liked token:", tokenId);
  };

  const handleComment = (tokenId: string) => {
    console.log("Comment on token:", tokenId);
  };

  const handleBookmark = (tokenId: string) => {
    console.log("Bookmarked token:", tokenId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-destructive mb-2 text-lg font-semibold">{error}</p>
          <p className="text-muted-foreground mb-4 text-sm">API rate limit reached. Please wait a moment.</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (tokens.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">No tokens available</p>
          <p className="text-sm text-muted-foreground mb-4">API may be rate limited. Try again in a moment.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TrendingTokensList 
        tokens={trendingTokens}
        currentTokenId={currentTokenId}
        onTokenClick={handleTokenClick}
      />
      <NetworkSelector 
        selectedNetwork={selectedNetwork}
        onNetworkChange={setSelectedNetwork}
      />
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {tokens.map((token, index) => (
          <TokenCard
            key={token.id}
            token={token}
            onLike={handleLike}
            onComment={handleComment}
            onBookmark={handleBookmark}
            isEagerLoad={index < 3}
          />
        ))}
        {isLoadingMore && (
          <div className="h-screen flex items-center justify-center snap-start">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
};

export default Index;
