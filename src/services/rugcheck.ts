interface RugCheckToken {
  mint: string;
  name: string;
  symbol: string;
  supply: number;
  decimals: number;
}

interface RugCheckMarket {
  lp: {
    lpLocked: number;
    lpLockedPct: number;
    lpBurned: number;
    lpBurnedPct: number;
  };
  liquidity: number;
  marketCap: number;
}

interface RugCheckRisk {
  score: number;
  level: string;
  risks: Array<{
    name: string;
    value: string;
    description: string;
    score: number;
    level: string;
  }>;
}

interface TopHolder {
  owner: string;
  amount: number;
  pct: number;
}

interface RugCheckResponse {
  token: RugCheckToken;
  markets?: RugCheckMarket[];
  risks: RugCheckRisk[];
  topHolders: TopHolder[];
  freezeAuthority: string | null;
  mintAuthority: string | null;
}

const API_BASE = 'https://api.rugcheck.xyz/v1';

export const fetchRugCheckData = async (tokenAddress: string): Promise<RugCheckResponse | null> => {
  try {
    const response = await fetch(`${API_BASE}/tokens/${tokenAddress}/report`);
    
    if (!response.ok) {
      console.error(`Failed to fetch RugCheck data for ${tokenAddress}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching RugCheck data:', error);
    return null;
  }
};

export const getRiskLevelColor = (level: string): string => {
  switch (level?.toLowerCase()) {
    case 'good':
      return 'bg-success text-success-foreground';
    case 'warn':
      return 'bg-warning text-warning-foreground';
    case 'danger':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const formatRiskScore = (score: number): string => {
  return `${Math.round(score)}/100`;
};
