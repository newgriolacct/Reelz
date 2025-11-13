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
    console.log("Using cached access token");
    return cachedToken.token;
  }

  console.log("Generating new access token...");
  const timestamp = Math.floor(Date.now() / 1000);
  const signString = `${appKey}${timestamp}${appSecret}`;
  
  console.log("Sign string components:", { appKey, timestamp, appSecretLength: appSecret.length });
  
  // Calculate SHA1 signature
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest("SHA-1", encodedData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  console.log("Generated signature:", sign);

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

  console.log("Token API response status:", tokenResponse.status);

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Failed to get GoPlus access token:", tokenResponse.status, errorText);
    throw new Error(`Failed to authenticate with GoPlus: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  console.log("Token API response code:", tokenData.code);
  
  if (tokenData.code !== 1 || !tokenData.result?.access_token) {
    console.error("GoPlus token response error:", JSON.stringify(tokenData));
    throw new Error("Invalid token response from GoPlus");
  }

  const accessToken = tokenData.result.access_token;
  console.log("Successfully obtained access token:", accessToken.substring(0, 20) + "...");

  // Cache the token (expires in 1 hour minus 5 minutes for safety)
  cachedToken = {
    token: accessToken,
    expiresAt: Date.now() + (55 * 60 * 1000), // 55 minutes
  };

  return accessToken;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractAddress } = await req.json();
    
    console.log("Received request for contract:", contractAddress);
    
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

    console.log("GoPlus credentials found, getting access token...");

    // Get access token
    const accessToken = await getAccessToken(GOPLUS_APP_KEY, GOPLUS_APP_SECRET);

    console.log("Got access token, calling security API...");
    console.log("Access token (first 20 chars):", accessToken.substring(0, 20) + "...");

    // GoPlus API endpoint for Solana token security
    const url = `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${contractAddress}`;
    console.log("Request URL:", url);
    
    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "accept": "*/*"
    };
    console.log("Request headers:", JSON.stringify(headers).substring(0, 100) + "...");
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    console.log("Security API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GoPlus API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `GoPlus API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Security API response code:", data.code);
    
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
