import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { phoneNumber, amount, accountReference, learnerId, invoiceId } = await req.json();

    if (!phoneNumber || !amount || !accountReference) {
      throw new Error('Missing required fields: phoneNumber, amount, accountReference');
    }

    const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379';
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    if (!passkey) {
      throw new Error('M-Pesa passkey not configured');
    }

    // Get access token
    const accessToken = await getAccessToken();
    console.log('Access token obtained');

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    
    // Generate password
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Format phone number (remove leading 0 or +254 and add 254)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Callback URL - this will be the edge function URL
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: `Fee payment for ${accountReference}`,
    };

    console.log('Initiating STK push:', { phoneNumber: formattedPhone, amount, accountReference });

    const response = await fetch(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkPayload),
      }
    );

    const result = await response.json();
    console.log('STK Push response:', result);

    if (result.ResponseCode === '0') {
      // Store the pending transaction for tracking
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase.from('mpesa_transactions').insert({
        checkout_request_id: result.CheckoutRequestID,
        merchant_request_id: result.MerchantRequestID,
        phone_number: formattedPhone,
        amount: amount,
        account_reference: accountReference,
        learner_id: learnerId || null,
        invoice_id: invoiceId || null,
        status: 'pending',
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'STK push initiated successfully',
        checkoutRequestId: result.CheckoutRequestID,
        merchantRequestId: result.MerchantRequestID,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(result.errorMessage || result.ResponseDescription || 'STK push failed');
    }
  } catch (error: unknown) {
    console.error('Error in mpesa-stk-push:', error);
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
