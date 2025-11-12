import { ReactNode, useEffect, useState } from "react";
import { TrendingTokensList } from "./TrendingTokensList";
import { NetworkSelector } from "./NetworkSelector";
import { SocialBar } from "./SocialBar";
import { fetchAggregatedTrending } from "@/services/tokenAggregator";
import { Token } from "@/types/token";

interface AppLayoutProps {
  children: ReactNode;
  showTrendingBar?: boolean;
  showNetworkSelector?: boolean;
}

export const AppLayout = ({ 
  children, 
  showTrendingBar = true,
  showNetworkSelector = false 
}: AppLayoutProps) => {
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState('solana');
  const [currentTokenId, setCurrentTokenId] = useState<string>('');

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const tokens = await fetchAggregatedTrending(selectedNetwork);
        setTrendingTokens(tokens);
        if (tokens.length > 0) {
          setCurrentTokenId(tokens[0].id);
        }
      } catch (err) {
        console.error('Failed to load trending tokens:', err);
      }
    };

    loadTrending();
  }, [selectedNetwork]);

  const handleTokenClick = (tokenId: string) => {
    // Navigate to home page with token
    window.location.href = `/?token=${tokenId}`;
  };

  return (
    <>
      <SocialBar />
      {showTrendingBar && (
        <TrendingTokensList 
          tokens={trendingTokens}
          currentTokenId={currentTokenId}
          onTokenClick={handleTokenClick}
        />
      )}
      {showNetworkSelector && (
        <NetworkSelector 
          selectedNetwork={selectedNetwork}
          onNetworkChange={setSelectedNetwork}
        />
      )}
      {children}
    </>
  );
};
