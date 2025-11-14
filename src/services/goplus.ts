interface GoPlusTokenSecurity {
  is_open_source: string;
  is_proxy: string;
  is_mintable: string;
  owner_address: string;
  creator_address: string;
  can_take_back_ownership: string;
  owner_change_balance: string;
  hidden_owner: string;
  selfdestruct: string;
  external_call: string;
  buy_tax: string;
  sell_tax: string;
  is_honeypot: string;
  transfer_pausable: string;
  is_blacklisted: string;
  is_whitelisted: string;
  is_in_dex: string;
  slippage_modifiable: string;
  is_anti_whale: string;
  anti_whale_modifiable: string;
  trading_cooldown: string;
  personal_slippage_modifiable: string;
  cannot_buy: string;
  cannot_sell_all: string;
  holder_count: string;
  owner_percent: string;
  owner_balance: string;
  creator_percent: string;
  creator_balance: string;
  lp_holder_count: string;
  lp_total_supply: string;
  is_true_token: string;
  is_airdrop_scam: string;
  trust_list: string;
  other_potential_risks: string;
  note: string;
  honeypot_with_same_creator: string;
  fake_token: {
    value: string;
    is_fake_token: string;
  };
  holders: Array<{
    address: string;
    balance: string;
    percent: string;
    is_contract: number;
    is_locked: number;
    tag: string;
  }>;
  lp_holders: Array<{
    address: string;
    balance: string;
    percent: string;
    is_contract: number;
    is_locked: number;
    tag: string;
  }>;
}

interface GoPlusResponse {
  code: number;
  message: string;
  result: {
    [key: string]: GoPlusTokenSecurity;
  };
}

const GOPLUS_API_BASE = 'https://api.gopluslabs.io/api/v1';

export const fetchGoPlusSecurityData = async (tokenAddress: string): Promise<GoPlusTokenSecurity | null> => {
  try {
    // Get the APP_KEY from environment
    const appKey = import.meta.env.VITE_GOPLUS_APP_KEY;
    
    if (!appKey) {
      console.warn('GoPlus APP_KEY not configured');
      return null;
    }

    const response = await fetch(
      `${GOPLUS_API_BASE}/solana/token_security?contract_addresses=${tokenAddress}`,
      {
        headers: {
          'Authorization': `Bearer ${appKey}`,
          'Accept': '*/*'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch GoPlus data for ${tokenAddress}: ${response.status}`);
      return null;
    }
    
    const data: GoPlusResponse = await response.json();
    
    if (data.code !== 1) {
      console.error(`GoPlus API error: ${data.message}`);
      return null;
    }
    
    return data.result[tokenAddress] || null;
  } catch (error) {
    console.error('Error fetching GoPlus data:', error);
    return null;
  }
};

export const getHoneypotStatus = (isHoneypot: string): { status: 'safe' | 'warning' | 'danger', text: string } => {
  if (isHoneypot === '1') return { status: 'danger', text: 'Honeypot Detected' };
  return { status: 'safe', text: 'Not a Honeypot' };
};

export const getTaxLevel = (tax: string): { status: 'safe' | 'warning' | 'danger', text: string } => {
  const taxValue = parseFloat(tax || '0');
  if (taxValue === 0) return { status: 'safe', text: '0%' };
  if (taxValue <= 5) return { status: 'safe', text: `${taxValue}%` };
  if (taxValue <= 10) return { status: 'warning', text: `${taxValue}%` };
  return { status: 'danger', text: `${taxValue}%` };
};
