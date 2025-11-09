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
    const chain = url.searchParams.get('chain') || 'solana';
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '50'); // Fetch more to filter
    const minMc = parseFloat(url.searchParams.get('minMc') || '50000');
    const maxMc = parseFloat(url.searchParams.get('maxMc') || '10000000');
    
    const BIRDEYE_API_KEY = Deno.env.get('BIRDEYE_API_KEY');
    
    if (!BIRDEYE_API_KEY) {
      console.error('BIRDEYE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', data: [] }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Fetching tokens for chain: ${chain}, offset: ${offset}, limit: ${limit}, mcRange: ${minMc}-${maxMc}`);
    
    // Fetch from Birdeye API - get more tokens to filter by market cap
    const birdeyeResponse = await fetch(`https://public-api.birdeye.so/defi/token_trending?offset=${offset}&limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'x-chain': chain,
        'X-API-KEY': BIRDEYE_API_KEY,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!birdeyeResponse.ok) {
      console.error('Birdeye API error:', birdeyeResponse.status, birdeyeResponse.statusText);
      const errorText = await birdeyeResponse.text();
      console.error('Error response:', errorText);
      
      // Return empty data structure on rate limit or error
      return new Response(
        JSON.stringify({ 
          data: { tokens: [], updateUnixTime: Date.now() / 1000, updateTime: new Date().toISOString(), total: 0 },
          success: false,
          error: `Birdeye API error: ${birdeyeResponse.status}`
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await birdeyeResponse.json();
    console.log('Birdeye response:', JSON.stringify(data).substring(0, 500));
    
    // Filter tokens by market cap range
    let tokens = data.data?.tokens || [];
    const filteredTokens = tokens.filter((token: any) => {
      const mc = token.marketcap || 0;
      return mc >= minMc && mc <= maxMc;
    });
    
    console.log(`Filtered ${filteredTokens.length} tokens from ${tokens.length} (mcRange: ${minMc}-${maxMc})`);
    
    // Return filtered data with same structure
    const filteredData = {
      ...data,
      data: {
        ...data.data,
        tokens: filteredTokens.slice(0, 20) // Return 20 tokens in the range
      }
    };

    return new Response(
      JSON.stringify(filteredData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-tokens function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, data: [] }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
