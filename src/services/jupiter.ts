import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';

// Updated to use the correct Jupiter API v6 endpoints
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';
const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/quote`;
const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap`;
const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: any[];
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50 // 0.5% default slippage
): Promise<JupiterQuote> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false',
    });

    const url = `${JUPITER_QUOTE_API}?${params.toString()}`;
    console.log("🚀 Jupiter API request:", url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Jupiter API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Jupiter API returned ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Jupiter quote received:", data);
    
    if (!data || !data.outAmount) {
      throw new Error("Invalid quote response from Jupiter");
    }
    
    return data;
  } catch (error) {
    console.error("💥 Failed to get Jupiter quote:", error);
    throw error;
  }
}

export async function executeSwap(
  connection: Connection,
  wallet: any,
  quoteResponse: JupiterQuote
): Promise<string> {
  // Get serialized transaction from Jupiter
  const swapResponse = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: wallet.publicKey.toString(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!swapResponse.ok) {
    throw new Error('Failed to get swap transaction');
  }

  const { swapTransaction } = await swapResponse.json();

  // Deserialize the transaction
  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // Sign the transaction
  const signedTransaction = await wallet.signTransaction(transaction);

  // Send the transaction
  const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Confirm the transaction
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

export async function getTokenDecimals(
  connection: Connection,
  mintAddress: string
): Promise<number> {
  if (mintAddress === SOL_MINT) {
    return 9; // SOL has 9 decimals
  }

  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
    
    if (mintInfo.value && 'parsed' in mintInfo.value.data) {
      return mintInfo.value.data.parsed.info.decimals;
    }
  } catch (error) {
    console.error('Error fetching token decimals:', error);
  }
  
  return 6; // Default to 6 decimals
}

export { SOL_MINT };
