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
    const { data, error } = await supabase.functions.invoke('goplus-security', {
      body: { contractAddress: mintAddress }
    });

    if (error) {
      console.error('Error calling GoPlus function:', error);
      return null;
    }

    if (!data || data.code !== 1) {
      console.error('GoPlus API returned error:', data);
      return null;
    }

    // Transform GoPlus response to our format
    const tokenData = data.result?.[mintAddress];
    if (!tokenData) {
      return null;
    }

    // Calculate a simple score based on risk factors (0-10000 scale like RugCheck)
    let calculatedScore = 10000;
    const risks: Array<{ name: string; description: string; level: string; score: number }> = [];

    // Check for various risk factors and reduce score accordingly
    if (tokenData.is_mintable === '1') {
      calculatedScore -= 2000;
      risks.push({
        name: 'Mintable Token',
        description: 'The token owner can still mint new tokens, which could lead to inflation.',
        level: 'danger',
        score: -2000
      });
    }

    if (tokenData.is_freezeable === '1') {
      calculatedScore -= 2000;
      risks.push({
        name: 'Freezeable Token',
        description: 'The token owner can freeze individual accounts, preventing transfers.',
        level: 'danger',
        score: -2000
      });
    }

    if (parseFloat(tokenData.creator_balance || '0') > 5) {
      calculatedScore -= 1500;
      risks.push({
        name: 'High Creator Balance',
        description: `Creator holds ${parseFloat(tokenData.creator_balance || '0').toFixed(2)}% of supply.`,
        level: 'warn',
        score: -1500
      });
    }

    if (parseFloat(tokenData.lp_locked_percent || '0') < 50) {
      calculatedScore -= 1500;
      risks.push({
        name: 'Low LP Lock',
        description: `Only ${parseFloat(tokenData.lp_locked_percent || '0').toFixed(1)}% of liquidity is locked.`,
        level: 'warn',
        score: -1500
      });
    }

    const topHolders: Array<{ address?: string; pct?: number; amount?: number }> = [];
    if (tokenData.holder_list) {
      tokenData.holder_list.forEach((holder: any, idx: number) => {
        if (idx < 5) {
          topHolders.push({
            address: holder.address,
            pct: parseFloat(holder.percent || '0'),
            amount: parseFloat(holder.balance || '0')
          });
        }
      });
    }

    const transformedData: RugCheckReport = {
      mint: mintAddress,
      name: tokenData.token_name,
      symbol: tokenData.token_symbol,
      tokenType: 'SPL Token',
      score: Math.max(0, calculatedScore),
      risks: risks,
      tokenMeta: {
        freezeAuthority: tokenData.is_freezeable === '1' ? 'active' : null,
        mintAuthority: tokenData.is_mintable === '1' ? 'active' : null,
        updateAuthority: null
      },
      markets: [{
        lp: {
          lpLockedPct: parseFloat(tokenData.lp_locked_percent || '0'),
          lpBurnPct: parseFloat(tokenData.lp_burn_percent || '0'),
          lpTotalSupply: parseFloat(tokenData.lp_total_supply || '0')
        }
      }],
      topHolders: topHolders,
      creator: {
        address: tokenData.creator_address,
        pct: parseFloat(tokenData.creator_balance || '0'),
        amount: 0
      },
      totalSupply: parseFloat(tokenData.total_supply || '0'),
      circulatingSupply: 0,
      lockedPct: parseFloat(tokenData.lp_locked_percent || '0'),
      rugged: false
    };

    return transformedData;
  } catch (error) {
    console.error('Error fetching GoPlus report:', error);
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
