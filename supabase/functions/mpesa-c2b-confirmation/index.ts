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
    console.log('C2B Confirmation received:', JSON.stringify(body, null, 2));

    const {
      TransactionType,
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber, // Learner's admission number
      OrgAccountBalance,
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
    } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find the learner by admission number
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('id, first_name, last_name, admission_number, current_grade_id')
      .eq('admission_number', BillRefNumber)
      .single();

    if (learnerError || !learner) {
      console.error('Learner not found for confirmation:', BillRefNumber);
      // Still acknowledge receipt
      return new Response(JSON.stringify({
        ResultCode: "0",
        ResultDesc: "Accepted",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing payment for learner: ${learner.first_name} ${learner.last_name}`);

    // Store the M-Pesa transaction
    const { error: txnError } = await supabase
      .from('mpesa_transactions')
      .insert({
        transaction_id: TransID,
        transaction_type: TransactionType,
        phone_number: MSISDN,
        amount: parseFloat(TransAmount),
        account_reference: BillRefNumber,
        learner_id: learner.id,
        status: 'completed',
        mpesa_receipt_number: TransID,
        transaction_date: TransTime,
        payer_name: `${FirstName || ''} ${MiddleName || ''} ${LastName || ''}`.trim(),
      });

    if (txnError) {
      console.error('Error storing M-Pesa transaction:', txnError);
    }

    // Find the latest unpaid invoice for this learner
    const { data: invoice, error: invoiceError } = await supabase
      .from('student_invoices')
      .select('id, balance_due')
      .eq('learner_id', learner.id)
      .gt('balance_due', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (invoice && !invoiceError) {
      // Record the fee payment
      const { error: paymentError } = await supabase
        .from('fee_transactions')
        .insert({
          invoice_id: invoice.id,
          learner_id: learner.id,
          amount_paid: parseFloat(TransAmount),
          payment_method: 'mpesa',
          reference_number: TransID,
          transaction_number: `MPESA-${TransID}`,
          recorded_by: learner.id,
          notes: `M-Pesa C2B payment from ${MSISDN} - ${FirstName || ''} ${LastName || ''}`,
        });

      if (paymentError) {
        console.error('Error recording fee payment:', paymentError);
      } else {
        console.log(`Fee payment of ${TransAmount} recorded for invoice ${invoice.id}`);
      }
    } else {
      // No invoice found, store as fee payment anyway
      const { error: feePaymentError } = await supabase
        .from('fee_payments')
        .insert({
          learner_id: learner.id,
          fee_structure_id: null, // Will need to be linked later
          amount_paid: parseFloat(TransAmount),
          payment_method: 'mpesa',
          receipt_number: TransID,
          notes: `M-Pesa C2B payment - ${FirstName || ''} ${LastName || ''}`,
          status: 'paid',
        });

      if (feePaymentError) {
        console.error('Error storing fee payment:', feePaymentError);
      }
    }

    // Notify admins
    await supabase.rpc('notify_admins', {
      p_type: 'mpesa_payment',
      p_title: 'M-Pesa Payment Received',
      p_message: `Payment of KSh ${TransAmount} received from ${MSISDN} for ${learner.first_name} ${learner.last_name} (${BillRefNumber})`,
      p_entity_type: 'mpesa_transaction',
      p_entity_id: null,
    });

    console.log('C2B Confirmation processed successfully');

    return new Response(JSON.stringify({
      ResultCode: "0",
      ResultDesc: "Accepted",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mpesa-c2b-confirmation:', error);
    return new Response(JSON.stringify({
      ResultCode: "0",
      ResultDesc: "Accepted",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
