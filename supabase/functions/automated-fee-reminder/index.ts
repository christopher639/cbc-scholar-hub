import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    console.log("Checking for automated fee reminders to send...");

    // Get fee reminder settings
    const { data: settings, error: settingsError } = await supabase
      .from("fee_reminder_settings")
      .select("*")
      .single();

    if (settingsError || !settings) {
      console.log("No fee reminder settings found");
      return new Response(
        JSON.stringify({ success: false, message: "No fee reminder settings configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.is_enabled) {
      console.log("Automated fee reminders are disabled");
      return new Response(
        JSON.stringify({ success: false, message: "Automated reminders are disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if it's time to run
    const now = new Date();
    const nextRun = settings.next_run_at ? new Date(settings.next_run_at) : null;

    if (nextRun && now < nextRun) {
      console.log(`Not time to run yet. Next run: ${nextRun.toISOString()}`);
      return new Response(
        JSON.stringify({ success: false, message: "Not scheduled to run yet" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      console.log("No active academic period");
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

    if (settings.scope === "grade" && settings.grade_id) {
      learnersQuery = learnersQuery.eq("current_grade_id", settings.grade_id);
    }

    const { data: learners, error: learnersError } = await learnersQuery;

    if (learnersError) {
      console.error("Error fetching learners:", learnersError);
      throw learnersError;
    }

    if (!learners || learners.length === 0) {
      console.log("No learners found");
      // Update last run time even if no learners
      await supabase
        .from("fee_reminder_settings")
        .update({
          last_run_at: now.toISOString(),
          next_run_at: new Date(now.getTime() + settings.interval_days * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", settings.id);

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

    // Calculate balances per learner
    const balancesByLearner = new Map<string, { currentTerm: number; previousBalance: number; totalBalance: number }>();

    for (const learner of learners) {
      const learnerInvoices = invoices?.filter(inv => inv.learner_id === learner.id) || [];

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

      // Calculate balance based on settings
      let balanceToShow = 0;
      let balanceLabel = "";

      if (settings.include_current_term && settings.include_previous_balance) {
        balanceToShow = balances.totalBalance;
        balanceLabel = "Total balance";
      } else if (settings.include_current_term) {
        balanceToShow = balances.currentTerm;
        balanceLabel = "Current term balance";
      } else if (settings.include_previous_balance) {
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
      // Update run times even with no messages
      await supabase
        .from("fee_reminder_settings")
        .update({
          last_run_at: now.toISOString(),
          next_run_at: new Date(now.getTime() + settings.interval_days * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", settings.id);

      return new Response(
        JSON.stringify({ success: true, message: "No outstanding balances to remind" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending ${smsList.length} automated fee reminder SMS messages`);

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

    // Update last run and next run times
    await supabase
      .from("fee_reminder_settings")
      .update({
        last_run_at: now.toISOString(),
        next_run_at: new Date(now.getTime() + settings.interval_days * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", settings.id);

    console.log(`Automated fee reminders complete: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Automated fee reminder SMS sent: ${totalSent} successful, ${totalFailed} failed`,
        totalSent,
        totalFailed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in automated-fee-reminder:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
