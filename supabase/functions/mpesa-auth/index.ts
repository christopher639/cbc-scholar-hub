import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sandbox URL - change to production URL when going live
const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }

    // Create base64 encoded credentials
    const credentials = btoa(`${consumerKey}:${consumerSecret}`);

    console.log('Fetching M-Pesa access token...');

    const response = await fetch(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('M-Pesa auth error:', errorText);
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    console.log('M-Pesa access token obtained successfully');

    return new Response(JSON.stringify({
      access_token: data.access_token,
      expires_in: data.expires_in,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in mpesa-auth:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
