import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { messageId } = await req.json();

    console.log("Processing bulk message:", messageId);

    // Get the bulk message details
    const { data: message, error: messageError } = await supabase
      .from("bulk_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      throw new Error("Message not found");
    }

    console.log("Message details:", {
      recipient_type: message.recipient_type,
      message_type: message.message_type,
      grade_id: message.grade_id,
      stream_id: message.stream_id
    });

    let emailList: string[] = [];
    let sentCount = 0;
    let failedCount = 0;

    // Handle different recipient types
    if (message.recipient_type === "all_teachers") {
      // Get all teachers' emails
      const { data: teachers, error: teachersError } = await supabase
        .from("teachers")
        .select("email, first_name, last_name");

      if (teachersError) {
        console.error("Error fetching teachers:", teachersError);
        throw teachersError;
      }

      emailList = teachers?.filter(t => t.email).map(t => t.email) || [];
      console.log(`Found ${emailList.length} teachers to email`);

    } else {
      // Get parent recipients based on recipient_type (all, grade, stream)
      let recipientsQuery = supabase
        .from("learners")
        .select(`
          id,
          first_name,
          last_name,
          parent_id,
          parents!inner(email, first_name, last_name)
        `)
        .eq("status", "active");

      if (message.recipient_type === "grade" && message.grade_id) {
        recipientsQuery = recipientsQuery.eq("current_grade_id", message.grade_id);
      } else if (message.recipient_type === "stream" && message.stream_id) {
        recipientsQuery = recipientsQuery.eq("current_stream_id", message.stream_id);
      }

      const { data: learners, error: learnersError } = await recipientsQuery;

      if (learnersError) {
        console.error("Error fetching learners:", learnersError);
        throw learnersError;
      }

      console.log(`Found ${learners?.length || 0} learners with parents`);

      // Extract unique parent emails
      const parentEmails = new Set<string>();
      learners?.forEach((learner: any) => {
        if (learner.parents?.email) {
          parentEmails.add(learner.parents.email);
        }
      });

      emailList = Array.from(parentEmails);
      console.log(`Found ${emailList.length} unique parent emails`);
    }

    // Send emails only if message_type is email or both
    if (message.message_type === "email" || message.message_type === "both") {
      for (const email of emailList) {
        try {
          await resend.emails.send({
            from: "School Admin <onboarding@resend.dev>",
            to: [email],
            subject: message.subject || "School Communication",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${message.subject || "School Communication"}</h2>
                <div style="margin: 20px 0; line-height: 1.6;">
                  ${message.message.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                  This is an automated message from the school administration.
                </p>
              </div>
            `,
          });
          sentCount++;
          console.log(`Email sent to: ${email}`);
        } catch (error) {
          failedCount++;
          console.error(`Failed to send email to ${email}:`, error);
        }
      }
    } else {
      // For SMS only, just count as sent (actual SMS integration would go here)
      sentCount = emailList.length;
    }

    // Update the bulk_messages record
    await supabase
      .from("bulk_messages")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
      })
      .eq("id", messageId);

    console.log(`Bulk message processed. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        failedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
