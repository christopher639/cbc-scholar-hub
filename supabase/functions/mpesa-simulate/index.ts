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
    const { phoneNumber, amount, accountReference } = await req.json();

    if (!phoneNumber || !amount || !accountReference) {
      throw new Error('Missing required fields: phoneNumber, amount, accountReference');
    }

    const shortcode = Deno.env.get('MPESA_SHORTCODE') || '600000';
    const accessToken = await getAccessToken();

    console.log('Simulating C2B transaction:', { phoneNumber, amount, accountReference });

    // Format phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const simulatePayload = {
      ShortCode: shortcode,
      CommandID: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      Msisdn: formattedPhone,
      BillRefNumber: accountReference, // Learner's admission number
    };

    const response = await fetch(
      `${MPESA_BASE_URL}/mpesa/c2b/v1/simulate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulatePayload),
      }
    );

    const result = await response.json();
    console.log('C2B Simulation response:', result);

    return new Response(JSON.stringify({
      success: result.ResponseCode === '0' || result.ResponseDescription?.includes('Accept'),
      message: result.ResponseDescription || result.errorMessage,
      data: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in mpesa-simulate:', error);
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
