import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache access token (in-memory, valid for ~1 hour)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(appKey: string, appSecret: string): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signString = `${appKey}${timestamp}${appSecret}`;
  
  // Calculate SHA1 signature
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest("SHA-1", encodedData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const tokenResponse = await fetch("https://api.gopluslabs.io/api/v1/token", {
    method: "POST",
    headers: {
      "accept": "*/*",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      app_key: appKey,
      sign: sign,
      time: timestamp,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Failed to get GoPlus access token:", tokenResponse.status, errorText);
    throw new Error(`Failed to authenticate with GoPlus: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  
  if (tokenData.code !== 1 || !tokenData.result?.access_token) {
    console.error("GoPlus token response error:", tokenData);
    throw new Error("Invalid token response from GoPlus");
  }

  // Cache the token (expires in 1 hour minus 5 minutes for safety)
  cachedToken = {
    token: tokenData.result.access_token,
    expiresAt: Date.now() + (55 * 60 * 1000), // 55 minutes
  };

  return tokenData.result.access_token;
}

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

    // Get access token
    const accessToken = await getAccessToken(GOPLUS_APP_KEY, GOPLUS_APP_SECRET);

    // GoPlus API endpoint for Solana token security
    const url = `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${contractAddress}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
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
