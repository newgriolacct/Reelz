import { TokenCard } from "@/components/TokenCard";
import { BottomNav } from "@/components/BottomNav";
import { TrendingTokensList } from "@/components/TrendingTokensList";
import { NetworkSelector } from "@/components/NetworkSelector";
import { fetchAggregatedTrending, fetchAggregatedRandom } from "@/services/tokenAggregator";
import { convertDexPairToToken } from "@/types/token";
import { useEffect, useState, useRef, useCallback } from "react";
import { Token } from "@/types/token";

const Index = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTokenId, setCurrentTokenId] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [seenTokenIds, setSeenTokenIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadMoreTokens = useCallback(async () => {
    setLoadingMore(prev => {
      if (prev) return prev; // Already loading
      
      // Start loading
      fetchAggregatedRandom(selectedNetwork)
        .then(pairs => {
          const convertedTokens = pairs.map(convertDexPairToToken);
          
          // Filter out tokens we've already seen
          setSeenTokenIds(prev => {
            const newTokens = convertedTokens.filter(token => !prev.has(token.id));
            
            if (newTokens.length > 0) {
              setTokens(currentTokens => [...currentTokens, ...newTokens]);
              return new Set([...prev, ...newTokens.map(t => t.id)]);
            }
            return prev;
          });
        })
        .catch(err => {
          console.error('Failed to load more tokens', err);
        })
        .finally(() => {
          setLoadingMore(false);
        });
      
      return true; // Set loading to true
    });
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
        const [randomPairs, trendingPairs] = await Promise.all([
          fetchAggregatedRandom(selectedNetwork),
          fetchAggregatedTrending(selectedNetwork)
        ]);
        
        const convertedRandom = randomPairs.map(convertDexPairToToken);
        const convertedTrending = trendingPairs.map(convertDexPairToToken);
        
        console.log(`Loaded ${convertedRandom.length} tokens for ${selectedNetwork}`);
        
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
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const windowHeight = window.innerHeight;
        
        // Update current token
        const currentIndex = Math.round(scrollTop / windowHeight);
        if (tokens[currentIndex]) {
          setCurrentTokenId(tokens[currentIndex].id);
        }
        
        // Load more when near bottom
        if (scrollHeight - scrollTop - clientHeight < windowHeight * 2) {
          loadMoreTokens();
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [tokens, loadMoreTokens]);

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
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
            }} 
            className="text-primary hover:underline"
          >
            Retry
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
        {loadingMore && (
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
