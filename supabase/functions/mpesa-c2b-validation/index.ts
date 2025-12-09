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
    console.log('C2B Validation request received:', JSON.stringify(body, null, 2));

    const {
      TransactionType,
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber, // This is the learner's admission number
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
    } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate the account reference (BillRefNumber should be learner's admission number)
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('id, first_name, last_name, admission_number, status')
      .eq('admission_number', BillRefNumber)
      .single();

    if (learnerError || !learner) {
      console.log(`Invalid account reference: ${BillRefNumber}`);
      // Reject the transaction - invalid account
      return new Response(JSON.stringify({
        ResultCode: "C2B00012",
        ResultDesc: "Invalid Account Number. Please use learner admission number.",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (learner.status !== 'active') {
      console.log(`Learner is not active: ${BillRefNumber}`);
      return new Response(JSON.stringify({
        ResultCode: "C2B00013",
        ResultDesc: "Learner account is not active.",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Validation successful for learner: ${learner.first_name} ${learner.last_name}`);

    // Accept the transaction
    return new Response(JSON.stringify({
      ResultCode: "0",
      ResultDesc: "Accepted",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mpesa-c2b-validation:', error);
    // Accept anyway to avoid issues
    return new Response(JSON.stringify({
      ResultCode: "0",
      ResultDesc: "Accepted",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
