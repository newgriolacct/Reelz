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
  const [error, setError] = useState<string | null>(null);
  const [currentTokenId, setCurrentTokenId] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        const pairs = await fetchTrendingTokens();
        const convertedTokens = pairs.map(convertDexPairToToken);
        setTokens(convertedTokens);
        if (convertedTokens.length > 0) {
          setCurrentTokenId(convertedTokens[0].id);
        }
      } catch (err) {
        setError('Failed to load tokens');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  // Track current token on scroll with threshold to prevent accidental switches
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Clear previous timeout
      clearTimeout(scrollTimeout);
      
      // Wait for scroll to settle before updating
      scrollTimeout = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const windowHeight = window.innerHeight;
        // Only switch if scrolled past 70% of the card
        const currentIndex = Math.round(scrollTop / windowHeight);
        if (tokens[currentIndex]) {
          setCurrentTokenId(tokens[currentIndex].id);
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [tokens]);

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
      <NetworkSelector />
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-hide"
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
      </div>
      <BottomNav />
    </>
  );
};

export default Index;
