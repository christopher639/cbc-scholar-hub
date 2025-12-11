import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeeReminderRequest {
  scope: "school" | "grade" | "stream";
  gradeId?: string;
  streamId?: string;
  includeCurrentTerm: boolean;
  includePreviousBalance: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("TEXT_SMS_API_KEY")!;
    const partnerId = "15265";
    const shortcode = "TextSMS";

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { scope, gradeId, streamId, includeCurrentTerm, includePreviousBalance }: FeeReminderRequest = await req.json();

    console.log("Fee reminder request:", { scope, gradeId, streamId, includeCurrentTerm, includePreviousBalance });

    // Get school info
    const { data: schoolInfo } = await supabase
      .from("school_info")
      .select("school_name, mpesa_paybill")
      .single();

    const schoolName = schoolInfo?.school_name || "School";
    const paybill = schoolInfo?.mpesa_paybill || "";

    // Get current academic period
    const { data: currentPeriod } = await supabase
      .from("academic_periods")
      .select("academic_year, term")
      .eq("is_current", true)
      .single();

    if (!currentPeriod) {
      return new Response(
        JSON.stringify({ success: false, message: "No active academic period found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build learner query based on scope
    let learnersQuery = supabase
      .from("learners")
      .select(`
        id,
        first_name,
        last_name,
        admission_number,
        current_grade_id,
        current_stream_id,
        parent:parents(phone, first_name, last_name)
      `)
      .eq("status", "active");

    if (scope === "grade" && gradeId) {
      learnersQuery = learnersQuery.eq("current_grade_id", gradeId);
    } else if (scope === "stream" && streamId) {
      learnersQuery = learnersQuery.eq("current_stream_id", streamId);
    }

    const { data: learners, error: learnersError } = await learnersQuery;

    if (learnersError) {
      console.error("Error fetching learners:", learnersError);
      throw learnersError;
    }

    if (!learners || learners.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No learners found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    const formatPhone = (phone: string): string | null => {
      if (!phone) return null;
      let cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "254" + cleaned.substring(1);
      } else if (!cleaned.startsWith("254")) {
        cleaned = "254" + cleaned;
      }
      if (cleaned.length < 12) return null;
      return cleaned;
    };

    // Get all invoices for learners
    const learnerIds = learners.map(l => l.id);
    
    const { data: invoices } = await supabase
      .from("student_invoices")
      .select("*")
      .in("learner_id", learnerIds)
      .neq("status", "cancelled");

    // Get all transactions
    const { data: transactions } = await supabase
      .from("fee_transactions")
      .select("learner_id, amount_paid")
      .in("learner_id", learnerIds);

    // Get all fee_payments
    const { data: feePayments } = await supabase
      .from("fee_payments")
      .select("learner_id, amount_paid")
      .in("learner_id", learnerIds);

    // Calculate balances per learner
    const balancesByLearner = new Map<string, { currentTerm: number; previousBalance: number; totalBalance: number }>();

    for (const learner of learners) {
      const learnerInvoices = invoices?.filter(inv => inv.learner_id === learner.id) || [];
      const learnerTransactions = transactions?.filter(t => t.learner_id === learner.id) || [];
      const learnerFeePayments = feePayments?.filter(p => p.learner_id === learner.id) || [];

      // Current term invoice
      const currentTermInvoice = learnerInvoices.find(
        inv => inv.academic_year === currentPeriod.academic_year && inv.term === currentPeriod.term
      );

      // Previous term invoices
      const previousInvoices = learnerInvoices.filter(
        inv => !(inv.academic_year === currentPeriod.academic_year && inv.term === currentPeriod.term)
      );

      const currentTermTotal = currentTermInvoice ? Number(currentTermInvoice.total_amount) - Number(currentTermInvoice.discount_amount || 0) : 0;
      const currentTermPaid = currentTermInvoice ? Number(currentTermInvoice.amount_paid) : 0;
      const currentTermBalance = currentTermTotal - currentTermPaid;

      const previousTotal = previousInvoices.reduce((sum, inv) => sum + Number(inv.total_amount) - Number(inv.discount_amount || 0), 0);
      const previousPaid = previousInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
      const previousBalance = previousTotal - previousPaid;

      const totalBalance = currentTermBalance + previousBalance;

      balancesByLearner.set(learner.id, {
        currentTerm: currentTermBalance,
        previousBalance: previousBalance,
        totalBalance: totalBalance,
      });
    }

    // Prepare SMS list
    const smsList: any[] = [];
    let clientSmsId = 1;

    for (const learner of learners) {
      const parent = learner.parent as any;
      if (!parent?.phone) continue;

      const formattedPhone = formatPhone(parent.phone);
      if (!formattedPhone) continue;

      const balances = balancesByLearner.get(learner.id);
      if (!balances) continue;

      // Only send if there's a balance to remind
      let balanceToShow = 0;
      let balanceLabel = "";

      if (includeCurrentTerm && includePreviousBalance) {
        balanceToShow = balances.totalBalance;
        balanceLabel = "Total balance";
      } else if (includeCurrentTerm) {
        balanceToShow = balances.currentTerm;
        balanceLabel = "Current term balance";
      } else if (includePreviousBalance) {
        balanceToShow = balances.previousBalance;
        balanceLabel = "Previous balance";
      } else {
        balanceToShow = balances.totalBalance;
        balanceLabel = "Total balance";
      }

      if (balanceToShow <= 0) continue;

      const formatKsh = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`;
      const paybillInfo = paybill ? ` Paybill: ${paybill}, A/C: ${learner.admission_number}` : "";

      const message = `${schoolName}: Dear ${parent.first_name}, ${learner.first_name}'s fee reminder. ${balanceLabel}: ${formatKsh(balanceToShow)}.${paybillInfo} Thank you.`;

      smsList.push({
        partnerID: partnerId,
        apikey: apiKey,
        pass_type: "plain",
        clientsmsid: clientSmsId++,
        mobile: formattedPhone,
        message: message.substring(0, 160),
        shortcode: shortcode,
      });
    }

    if (smsList.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No parents with outstanding balances found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending ${smsList.length} fee reminder SMS messages`);

    // Send in batches of 20
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < smsList.length; i += 20) {
      const batch = smsList.slice(i, i + 20);
      
      const response = await fetch("https://sms.textsms.co.ke/api/services/sendbulk/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: batch.length,
          smslist: batch,
        }),
      });

      const result = await response.json();
      console.log(`Batch ${Math.floor(i / 20) + 1} response:`, result);

      for (const resp of result.responses || []) {
        if (resp["response-code"] === 200) {
          totalSent++;
        } else {
          totalFailed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fee reminder SMS sent: ${totalSent} successful, ${totalFailed} failed`,
        totalSent,
        totalFailed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-fee-reminder-sms:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
