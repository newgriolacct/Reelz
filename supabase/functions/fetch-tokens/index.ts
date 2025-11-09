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
    
    const BIRDEYE_API_KEY = Deno.env.get('BIRDEYE_API_KEY');
    
    if (!BIRDEYE_API_KEY) {
      console.error('BIRDEYE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', data: [] }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Fetching trending tokens for chain:', chain);
    
    // Fetch from Birdeye API
    const birdeyeResponse = await fetch('https://public-api.birdeye.so/defi/token_trending', {
      headers: {
        'Accept': 'application/json',
        'x-chain': chain,
        'X-API-KEY': BIRDEYE_API_KEY,
      },
    });

    if (!birdeyeResponse.ok) {
      console.error('Birdeye API error:', birdeyeResponse.status, birdeyeResponse.statusText);
      const errorText = await birdeyeResponse.text();
      console.error('Error response:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `Birdeye API error: ${birdeyeResponse.status}`,
          data: [] 
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await birdeyeResponse.json();
    console.log('Birdeye response:', JSON.stringify(data).substring(0, 500));
    console.log(`Successfully fetched ${data.data?.tokens?.length || 0} trending tokens`);

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
      JSON.stringify({ error: errorMessage, data: [] }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
