// RugCheck API service for token security analysis
const RUGCHECK_API_BASE = 'https://api.rugcheck.xyz';

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
    const response = await fetch(`${RUGCHECK_API_BASE}/v1/tokens/${mintAddress}/report`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Token not found
      }
      throw new Error(`RugCheck API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching RugCheck report:', error);
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
