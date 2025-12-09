import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(body, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const stkCallback = body.Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('Invalid callback structure');
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const merchantRequestId = stkCallback.MerchantRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log(`Processing callback for CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`);

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      
      let amount = 0;
      let mpesaReceiptNumber = '';
      let transactionDate = '';
      let phoneNumber = '';

      for (const item of callbackMetadata) {
        switch (item.Name) {
          case 'Amount':
            amount = item.Value;
            break;
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = item.Value;
            break;
          case 'TransactionDate':
            transactionDate = item.Value?.toString();
            break;
          case 'PhoneNumber':
            phoneNumber = item.Value?.toString();
            break;
        }
      }

      console.log(`Payment successful: Amount=${amount}, Receipt=${mpesaReceiptNumber}`);

      // Update the transaction record
      const { data: txn, error: updateError } = await supabase
        .from('mpesa_transactions')
        .update({
          status: 'completed',
          mpesa_receipt_number: mpesaReceiptNumber,
          transaction_date: transactionDate,
          result_code: resultCode,
          result_desc: resultDesc,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', checkoutRequestId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      } else if (txn && txn.learner_id && txn.invoice_id) {
        // Record the fee payment
        const { error: paymentError } = await supabase
          .from('fee_transactions')
          .insert({
            invoice_id: txn.invoice_id,
            learner_id: txn.learner_id,
            amount_paid: amount,
            payment_method: 'mpesa',
            reference_number: mpesaReceiptNumber,
            transaction_number: `MPESA-${mpesaReceiptNumber}`,
            recorded_by: txn.learner_id, // Will be updated later
            notes: `M-Pesa payment from ${phoneNumber}`,
          });

        if (paymentError) {
          console.error('Error recording fee payment:', paymentError);
        } else {
          console.log('Fee payment recorded successfully');
        }
      }
    } else {
      // Payment failed
      console.log(`Payment failed: ${resultDesc}`);
      
      await supabase
        .from('mpesa_transactions')
        .update({
          status: 'failed',
          result_code: resultCode,
          result_desc: resultDesc,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', checkoutRequestId);
    }

    // Always return success to M-Pesa
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mpesa-callback:', error);
    // Still return success to avoid M-Pesa retries
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
