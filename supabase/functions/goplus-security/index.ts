import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractAddress } = await req.json();
    
    if (!contractAddress) {
      return new Response(
        JSON.stringify({ error: "Contract address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOPLUS_APP_KEY = Deno.env.get("GOPLUS_APP_KEY");
    const GOPLUS_APP_SECRET = Deno.env.get("GOPLUS_APP_SECRET");

    if (!GOPLUS_APP_KEY || !GOPLUS_APP_SECRET) {
      console.error("GoPlus credentials not configured");
      return new Response(
        JSON.stringify({ error: "GoPlus API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GoPlus API endpoint for Solana token security
    const url = `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${contractAddress}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GOPLUS_APP_KEY}`,
        "accept": "*/*"
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GoPlus API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `GoPlus API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in goplus-security function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
