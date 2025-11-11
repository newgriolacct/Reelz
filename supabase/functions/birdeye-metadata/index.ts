import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tokenAddress } = await req.json();
    
    if (!tokenAddress) {
      return new Response(
        JSON.stringify({ error: 'Token address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const BIRDEYE_API_KEY = Deno.env.get('BIRDEYE_API_KEY');
    if (!BIRDEYE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Birdeye API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching Birdeye metadata for: ${tokenAddress}`);

    const url = `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`;
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Birdeye API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Birdeye API request failed', status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Birdeye data received for ${tokenAddress}`);

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in birdeye-metadata function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
