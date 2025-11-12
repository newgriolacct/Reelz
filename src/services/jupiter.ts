import { Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
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
  slippageBps: number = 100 // 1% default slippage
): Promise<JupiterQuote> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
  });

  const response = await fetch(`${JUPITER_QUOTE_API}?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to get quote from Jupiter');
  }

  return response.json();
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
