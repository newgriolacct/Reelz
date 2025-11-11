import { TokenCard } from "@/components/TokenCard";
import { BottomNav } from "@/components/BottomNav";
import { TrendingTokensList } from "@/components/TrendingTokensList";
import { NetworkSelector } from "@/components/NetworkSelector";
import { fetchAggregatedTrending, fetchAggregatedRandom, fetchSpecificToken } from "@/services/tokenAggregator";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Token } from "@/types/token";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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

  const loadMoreTokens = async () => {
    console.log('⚡ loadMoreTokens called, isLoading:', isLoadingMoreRef.current);
    if (isLoadingMoreRef.current) {
      console.log('⏸️ Already loading, skipping...');
      return;
    }
    
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    
    try {
      console.log('📡 Fetching more tokens...');
      const convertedTokens = await fetchAggregatedRandom(selectedNetwork);
      console.log(`✅ Got ${convertedTokens.length} tokens`);
      
      // INFINITE SCROLLING: Always add tokens, even if we've seen them
      if (convertedTokens.length > 0) {
        setTokens(currentTokens => {
          const updated = [...currentTokens, ...convertedTokens];
          tokensRef.current = updated;
          console.log(`📝 Total tokens now: ${updated.length}`);
          return updated;
        });
        
        setSeenTokenIds(prev => new Set([...prev, ...convertedTokens.map(t => t.id)]));
      } else {
        console.warn('⚠️ No tokens returned');
      }
    } catch (err) {
      console.error('❌ Failed to load more tokens:', err);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      console.log('✅ Loading complete');
    }
  };

  // Load initial tokens when network changes
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setError(null);
        setTokens([]);
        setTrendingTokens([]);
        setSeenTokenIds(new Set());
        setLoading(true);
        
        // Load both trending and random in parallel
        const [convertedRandom, convertedTrending] = await Promise.all([
          fetchAggregatedRandom(selectedNetwork, true),
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

  // Handle specific token from URL parameter
  useEffect(() => {
    const tokenId = searchParams.get('token');
    if (!tokenId || tokens.length === 0) return;

    const loadSpecificToken = async () => {
      console.log('🎯 URL token requested:', tokenId);
      
      // Check if token already exists in current feed
      const existingIndex = tokens.findIndex(t => t.id.toLowerCase() === tokenId.toLowerCase());
      if (existingIndex !== -1) {
        console.log('✅ Token already in feed at index', existingIndex);
        // Scroll to existing token
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: existingIndex * window.innerHeight,
            behavior: 'smooth'
          });
        }
        setSearchParams({}, { replace: true });
        return;
      }

      // Token not in feed, fetch it
      console.log(`Token ${tokenId} not in feed, fetching...`);
      const specificToken = await fetchSpecificToken(tokenId);
      
      if (specificToken) {
        console.log(`✅ Fetched ${specificToken.symbol}, adding to top`);
        const updatedTokens = [specificToken, ...tokens];
        setTokens(updatedTokens);
        tokensRef.current = updatedTokens;
        setSeenTokenIds(prev => new Set([...prev, specificToken.id]));
        setCurrentTokenId(specificToken.id);
        
        // Scroll to top
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        console.error('❌ Failed to fetch token');
      }
      
      // Clear URL param
      setSearchParams({}, { replace: true });
    };

    loadSpecificToken();
  }, [searchParams, tokens.length]);

  // Track current token on scroll and load more - THROTTLED FOR PERFORMANCE
  useEffect(() => {
    const container = scrollContainerRef.current;
    console.log('🎯 Scroll effect running, container:', container ? 'EXISTS' : 'NULL');
    console.log('🎯 Tokens length:', tokens.length);
    
    if (!container) {
      console.log('⚠️ Container not ready yet');
      return;
    }
    
    if (tokens.length === 0) {
      console.log('⚠️ No tokens loaded yet');
      return;
    }

    let scrollTimeout: NodeJS.Timeout;
    let lastScrollTime = 0;
    const THROTTLE_MS = 300; // Throttle to reduce lag

    const handleScroll = () => {
      const now = Date.now();
      
      // Throttle scroll events for performance
      if (now - lastScrollTime < THROTTLE_MS) {
        return;
      }
      lastScrollTime = now;
      
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
        
        // Load when scrolled past 75% OR within 4 tokens of bottom
        const tokensFromBottom = (scrollHeight - scrollTop - clientHeight) / windowHeight;
        const scrollProgress = ((scrollTop + clientHeight) / scrollHeight) * 100;
        
        console.log(`📊 Scroll: ${scrollProgress.toFixed(0)}% | Distance: ${tokensFromBottom.toFixed(1)} tokens | Total: ${currentTokens.length}`);
        
        // Trigger load
        if ((scrollProgress > 75 || tokensFromBottom < 4) && !isLoadingMoreRef.current) {
          console.log('🚀 Loading more tokens...');
          loadMoreTokens();
        }
      }, 100);
    };

    console.log('📍 Adding throttled scroll listener');
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    const initialCheckTimer = setTimeout(() => {
      console.log('⏰ Running initial scroll check');
      handleScroll();
    }, 100);
    
    return () => {
      console.log('🧹 Removing scroll listener');
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      clearTimeout(initialCheckTimer);
    };
  }, [tokens.length, selectedNetwork]);

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
          <p className="text-muted-foreground mb-4 text-sm">Unable to load tokens. Please try again.</p>
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
        <div className="text-center p-6 max-w-md">
          <p className="text-lg font-semibold mb-2">No Tokens Available</p>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to load tokens at the moment. The app will use cached data once available, or try refreshing.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh Now
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
            key={`${token.id}-${index}`}
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
