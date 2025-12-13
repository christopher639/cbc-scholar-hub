import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const credentials = btoa(`${consumerKey}:${consumerSecret}`);

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
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shortcode = Deno.env.get('MPESA_SHORTCODE') || '600426';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    const accessToken = await getAccessToken();
    console.log('Access token obtained for C2B registration');

    const validationUrl = `${supabaseUrl}/functions/v1/mpesa-c2b-validation`;
    const confirmationUrl = `${supabaseUrl}/functions/v1/mpesa-c2b-confirmation`;

    const registerPayload = {
      ShortCode: shortcode,
      ResponseType: "Completed",
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    };

    console.log('Registering C2B URLs:', { validationUrl, confirmationUrl });

const response = await fetch(
      `${MPESA_BASE_URL}/mpesa/c2b/v2/registerurl`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerPayload),
      }
    );

    const result = await response.json();
    console.log('C2B Registration response:', result);

    return new Response(JSON.stringify({
      success: result.ResponseDescription === 'Success' || result.ResponseCode === '0',
      message: result.ResponseDescription,
      data: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in mpesa-c2b-register:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
