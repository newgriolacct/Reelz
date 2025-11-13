// GoPlus Security API service for token security analysis
import { supabase } from "@/integrations/supabase/client";

export interface RugCheckReport {
  mint: string;
  name?: string;
  symbol?: string;
  tokenType?: string;
  risks?: Array<{
    name: string;
    description: string;
    level: string;
    score: number;
  }>;
  score?: number;
  tokenMeta?: {
    freezeAuthority?: string | null;
    mintAuthority?: string | null;
    updateAuthority?: string | null;
  };
  markets?: Array<{
    lp?: {
      lpLockedPct?: number;
      lpTotalSupply?: number;
      lpBurnPct?: number;
    };
  }>;
  topHolders?: Array<{
    address?: string;
    pct?: number;
    amount?: number;
  }>;
  creator?: {
    address?: string;
    pct?: number;
    amount?: number;
  };
  totalSupply?: number;
  circulatingSupply?: number;
  lockedPct?: number;
  rugged?: boolean;
  fileMeta?: {
    error?: string;
  };
}

export const fetchRugCheckReport = async (mintAddress: string): Promise<RugCheckReport | null> => {
  try {
    // Fetch from both RugCheck and GoPlus APIs
    const [rugCheckResponse, goPlusData] = await Promise.allSettled([
      fetch(`https://api.rugcheck.xyz/v1/tokens/${mintAddress}/report`),
      supabase.functions.invoke('goplus-security', {
        body: { contractAddress: mintAddress }
      })
    ]);

    let combinedData: RugCheckReport = {
      mint: mintAddress,
      tokenType: 'SPL Token',
      score: 5000, // Default medium score
      risks: [],
      tokenMeta: {},
      topHolders: [],
      totalSupply: 0,
      rugged: false
    };

    // Process RugCheck data
    if (rugCheckResponse.status === 'fulfilled' && rugCheckResponse.value.ok) {
      const rugCheckData = await rugCheckResponse.value.json();
      
      combinedData = {
        ...combinedData,
        name: rugCheckData.tokenMeta?.name,
        symbol: rugCheckData.tokenMeta?.symbol,
        score: rugCheckData.score || 5000,
        tokenMeta: {
          freezeAuthority: rugCheckData.tokenMeta?.freezeAuthority,
          mintAuthority: rugCheckData.tokenMeta?.mintAuthority,
          updateAuthority: rugCheckData.tokenMeta?.updateAuthority,
        },
        topHolders: rugCheckData.topHolders?.slice(0, 5) || [],
        totalSupply: rugCheckData.totalSupply,
        creator: rugCheckData.creator,
        rugged: rugCheckData.rugged || false,
        risks: rugCheckData.risks || []
      };
    }

    // Process GoPlus data and merge
    if (goPlusData.status === 'fulfilled' && !goPlusData.value.error) {
      const data = goPlusData.value.data;
      
      if (data && data.code === 1) {
        const tokenData = data.result?.[mintAddress];
        if (tokenData) {
          // Update name/symbol if not from RugCheck
          if (!combinedData.name) combinedData.name = tokenData.token_name;
          if (!combinedData.symbol) combinedData.symbol = tokenData.token_symbol;

          // Add GoPlus-specific risks
          const goPlusRisks: Array<{ name: string; description: string; level: string; score: number }> = [];
          
          if (tokenData.is_mintable === '1') {
            goPlusRisks.push({
              name: 'Mintable Token',
              description: 'Token owner can mint new tokens, risking inflation',
              level: 'danger',
              score: -2000
            });
          }

          if (tokenData.is_freezeable === '1') {
            goPlusRisks.push({
              name: 'Freezeable',
              description: 'Owner can freeze accounts and prevent transfers',
              level: 'danger',
              score: -2000
            });
          }

          const creatorBalance = parseFloat(tokenData.creator_balance || '0');
          if (creatorBalance > 10) {
            goPlusRisks.push({
              name: 'High Creator Holdings',
              description: `Creator holds ${creatorBalance.toFixed(1)}% of supply`,
              level: 'danger',
              score: -1500
            });
          } else if (creatorBalance > 5) {
            goPlusRisks.push({
              name: 'Moderate Creator Holdings',
              description: `Creator holds ${creatorBalance.toFixed(1)}% of supply`,
              level: 'warn',
              score: -1000
            });
          }

          // Merge risks (avoid duplicates)
          const existingRiskNames = new Set(combinedData.risks?.map(r => r.name.toLowerCase()) || []);
          goPlusRisks.forEach(risk => {
            if (!existingRiskNames.has(risk.name.toLowerCase())) {
              combinedData.risks?.push(risk);
            }
          });

          // Update authorities if not set
          if (!combinedData.tokenMeta?.freezeAuthority && tokenData.is_freezeable === '1') {
            combinedData.tokenMeta!.freezeAuthority = 'active';
          }
          if (!combinedData.tokenMeta?.mintAuthority && tokenData.is_mintable === '1') {
            combinedData.tokenMeta!.mintAuthority = 'active';
          }

          // Add top holders if not from RugCheck
          if (!combinedData.topHolders?.length && tokenData.holder_list) {
            combinedData.topHolders = tokenData.holder_list.slice(0, 5).map((holder: any) => ({
              address: holder.address,
              pct: parseFloat(holder.percent || '0'),
              amount: parseFloat(holder.balance || '0')
            }));
          }

          // Update creator info if not set
          if (!combinedData.creator && tokenData.creator_address) {
            combinedData.creator = {
              address: tokenData.creator_address,
              pct: parseFloat(tokenData.creator_balance || '0'),
              amount: 0
            };
          }

          // Update total supply if not set
          if (!combinedData.totalSupply && tokenData.total_supply) {
            combinedData.totalSupply = parseFloat(tokenData.total_supply || '0');
          }
        }
      }
    }

    return combinedData;
  } catch (error) {
    console.error('Error fetching security reports:', error);
    return null;
  }
};

export const calculateRiskLevel = (score?: number): 'GOOD' | 'MEDIUM' | 'HIGH' => {
  if (!score) return 'MEDIUM';
  if (score >= 7000) return 'GOOD';
  if (score >= 4000) return 'MEDIUM';
  return 'HIGH';
};

export const getRiskColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'danger':
    case 'critical':
      return 'destructive';
    case 'warn':
    case 'warning':
      return 'warning';
    default:
      return 'muted';
  }
};
