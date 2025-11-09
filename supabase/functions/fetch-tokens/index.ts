import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'profiles';
    
    let dexEndpoint = '';
    
    // Use different DexScreener endpoints
    if (type === 'profiles') {
      dexEndpoint = 'https://api.dexscreener.com/token-profiles/latest/v1';
    } else if (type === 'boosts') {
      dexEndpoint = 'https://api.dexscreener.com/token-boosts/latest/v1';
    }
    
    console.log('Fetching from DexScreener:', dexEndpoint);
    
    // Fetch from DexScreener API with proper headers
    const dexResponse = await fetch(dexEndpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; TokenAggregator/1.0)',
      },
    });

    if (!dexResponse.ok) {
      console.error('DexScreener API error:', dexResponse.status, dexResponse.statusText);
      return new Response(
        JSON.stringify({ 
          error: `DexScreener API error: ${dexResponse.status}`,
          pairs: [] // Return empty array to allow app to function
        }), 
        { 
          status: 200, // Return 200 to prevent frontend errors
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await dexResponse.json();
    
    // For token profiles/boosts, we need to fetch pair data
    if (Array.isArray(data)) {
      console.log(`Fetched ${data.length} tokens, now getting pair data...`);
      
      const pairs = [];
      
      // Get pair data for each token (limit to 10 for performance)
      for (const token of data.slice(0, 10)) {
        try {
          const tokenAddress = token.tokenAddress;
          const pairResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; TokenAggregator/1.0)',
            },
          });
          
          if (pairResponse.ok) {
            const pairData = await pairResponse.json();
            if (pairData.pairs && pairData.pairs.length > 0) {
              // Get the best pair (highest liquidity) for this token
              const bestPair = pairData.pairs
                .filter((p: any) => p.chainId === 'solana')
                .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
              
              if (bestPair) {
                pairs.push(bestPair);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching pair data:', err);
        }
      }
      
      console.log(`Successfully fetched ${pairs.length} pairs`);
      
      return new Response(
        JSON.stringify({ pairs }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // If data already has pairs structure, return it
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-tokens function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, pairs: [] }), 
      { 
        status: 200, // Return 200 to prevent frontend errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
