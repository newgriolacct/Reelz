import { TokenCard } from "@/components/TokenCard";
import { BottomNav } from "@/components/BottomNav";
import { TrendingTokensList } from "@/components/TrendingTokensList";
import { NetworkSelector } from "@/components/NetworkSelector";
import { fetchTrendingTokens } from "@/services/dexscreener";
import { convertDexPairToToken } from "@/types/token";
import { useEffect, useState, useRef } from "react";
import { Token } from "@/types/token";

const Index = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTokenId, setCurrentTokenId] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadMoreTokens = async () => {
    if (loadingMore) return;
    
    try {
      setLoadingMore(true);
      const pairs = await fetchTrendingTokens(selectedNetwork);
      const convertedTokens = pairs.map(convertDexPairToToken);
      setTokens(prev => [...prev, ...convertedTokens]);
    } catch (err) {
      console.error('Failed to load more tokens', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const loadTokens = async () => {
      try {
        // Don't show full loading screen when switching networks, just clear tokens
        if (tokens.length === 0) {
          setLoading(true);
        }
        setError(null);
        
        const pairs = await fetchTrendingTokens(selectedNetwork);
        const convertedTokens = pairs.map(convertDexPairToToken);
        setTokens(convertedTokens);
        
        if (convertedTokens.length > 0) {
          setCurrentTokenId(convertedTokens[0].id);
        }
        
        // Scroll to top when network changes
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        setError('Failed to load tokens');
        console.error(err);
      } finally {
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
        if (scrollHeight - scrollTop - clientHeight < windowHeight * 2 && !loadingMore) {
          loadMoreTokens();
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [tokens, loadingMore, loadMoreTokens]);

  const handleTokenClick = (tokenId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    if (tokenIndex !== -1) {
      container.scrollTo({
        top: tokenIndex * window.innerHeight,
        behavior: 'smooth'
      });
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
          <p className="text-muted-foreground">Loading trending tokens...</p>
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
            onClick={() => window.location.reload()} 
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
        tokens={tokens}
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
        {tokens.map((token) => (
          <TokenCard
            key={token.id}
            token={token}
            onLike={handleLike}
            onComment={handleComment}
            onBookmark={handleBookmark}
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
