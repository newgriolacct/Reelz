import { Connection, VersionedTransaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// Using Jupiter Lite API v1 endpoints
const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote';
const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap';
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

export async function getTokenBalance(
  connection: Connection,
  walletAddress: string,
  mintAddress: string
): Promise<number> {
  try {
    if (mintAddress === SOL_MINT) {
      // Get SOL balance
      const balance = await connection.getBalance(new PublicKey(walletAddress));
      return balance / LAMPORTS_PER_SOL;
    } else {
      // Get SPL token balance
      const mintPublicKey = new PublicKey(mintAddress);
      const walletPublicKey = new PublicKey(walletAddress);
      
      const tokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );
      
      const tokenAccount = await getAccount(connection, tokenAddress);
      const decimals = await getTokenDecimals(connection, mintAddress);
      
      return Number(tokenAccount.amount) / Math.pow(10, decimals);
    }
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

export { SOL_MINT };
