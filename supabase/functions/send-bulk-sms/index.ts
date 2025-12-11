import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmsRecipient {
  mobile: string;
  name: string;
  learner_name?: string;
}

interface TextSmsResponse {
  responses: Array<{
    "respose-code": number;
    "response-description": string;
    mobile: string;
    messageid?: number;
    networkid?: string;
    clientsmsid?: string;
  }>;
}

// Format phone number to Kenyan format (254...)
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Handle different formats
  if (cleaned.startsWith("254")) {
    return cleaned;
  } else if (cleaned.startsWith("0")) {
    return "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    return "254" + cleaned;
  }
  
  return cleaned;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId } = await req.json();

    if (!messageId) {
      throw new Error("Message ID is required");
    }

    console.log("Processing bulk SMS for message ID:", messageId);

    // Get API credentials
    const apiKey = Deno.env.get("TEXT_SMS_API_KEY");
    const partnerId = "15265"; // Partner ID provided by user
    const shortcode = "TextSMS"; // Default sender ID

    if (!apiKey) {
      throw new Error("TEXT_SMS_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the bulk message details
    const { data: messageData, error: messageError } = await supabase
      .from("bulk_messages")
      .select("*, grades(name), streams(name)")
      .eq("id", messageId)
      .single();

    if (messageError || !messageData) {
      throw new Error("Failed to fetch message: " + (messageError?.message || "Not found"));
    }

    console.log("Message data:", messageData);

    // Fetch school info for message personalization
    const { data: schoolInfo } = await supabase
      .from("school_info")
      .select("school_name")
      .single();

    const schoolName = schoolInfo?.school_name || "School";

    // Determine recipients based on recipient_type
    let recipients: SmsRecipient[] = [];

    if (messageData.recipient_type === "all_teachers" || messageData.recipient_type === "teachers") {
      // Get all teachers with phone numbers
      const { data: teachers, error: teachersError } = await supabase
        .from("teachers")
        .select("phone, first_name, last_name");

      if (teachersError) {
        throw new Error("Failed to fetch teachers: " + teachersError.message);
      }

      recipients = (teachers || [])
        .filter((t) => t.phone)
        .map((t) => ({
          mobile: formatPhoneNumber(t.phone!),
          name: `${t.first_name} ${t.last_name}`,
        }));

      console.log(`Found ${recipients.length} teachers with phone numbers`);
    } else {
      // Get parents based on recipient type
      let learnersQuery = supabase
        .from("learners")
        .select("id, first_name, last_name, current_grade_id, current_stream_id, parents(phone, first_name, last_name)")
        .eq("status", "active");

      if (messageData.recipient_type === "grade" && messageData.grade_id) {
        learnersQuery = learnersQuery.eq("current_grade_id", messageData.grade_id);
      } else if (messageData.recipient_type === "stream" && messageData.stream_id) {
        learnersQuery = learnersQuery.eq("current_stream_id", messageData.stream_id);
      }

      const { data: learners, error: learnersError } = await learnersQuery;

      if (learnersError) {
        throw new Error("Failed to fetch learners: " + learnersError.message);
      }

      // Extract parent phone numbers with learner info
      const parentPhones = new Map<string, SmsRecipient>();
      
      for (const learner of learners || []) {
        const parent = learner.parents as any;
        if (parent?.phone) {
          const formattedPhone = formatPhoneNumber(parent.phone);
          if (formattedPhone && !parentPhones.has(formattedPhone)) {
            parentPhones.set(formattedPhone, {
              mobile: formattedPhone,
              name: `${parent.first_name || ""} ${parent.last_name || ""}`.trim() || "Parent",
              learner_name: `${learner.first_name} ${learner.last_name}`,
            });
          }
        }
      }

      recipients = Array.from(parentPhones.values());
      console.log(`Found ${recipients.length} unique parent phone numbers`);
    }

    if (recipients.length === 0) {
      // Update status to sent with 0 count
      await supabase
        .from("bulk_messages")
        .update({
          status: "sent",
          sent_count: 0,
          failed_count: 0,
          sent_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      return new Response(
        JSON.stringify({ success: true, message: "No recipients with phone numbers found", sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Personalize message with school name
    const baseMessage = `${schoolName}: ${messageData.message}`;

    // Send SMS in batches of 20 (API limit)
    const batchSize = 20;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Build SMS list for bulk API
      const smsList = batch.map((recipient, index) => ({
        partnerID: partnerId,
        apikey: apiKey,
        pass_type: "plain",
        clientsmsid: `${messageId}_${i + index}`,
        mobile: recipient.mobile,
        message: baseMessage,
        shortcode: shortcode,
      }));

      console.log(`Sending batch ${Math.floor(i / batchSize) + 1} with ${smsList.length} messages`);

      try {
        const response = await fetch("https://sms.textsms.co.ke/api/services/sendbulk/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            count: smsList.length,
            smslist: smsList,
          }),
        });

        if (!response.ok) {
          console.error("TextSMS API error:", response.status, await response.text());
          totalFailed += batch.length;
          continue;
        }

        const result: TextSmsResponse = await response.json();
        console.log("TextSMS response:", JSON.stringify(result));

        // Count successes and failures
        for (const resp of result.responses || []) {
          if (resp["respose-code"] === 200) {
            totalSent++;
          } else {
            totalFailed++;
            console.log(`SMS failed for ${resp.mobile}: ${resp["response-description"]}`);
          }
        }
      } catch (batchError) {
        console.error("Error sending batch:", batchError);
        totalFailed += batch.length;
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Update message status
    const finalStatus = totalFailed === recipients.length ? "failed" : "sent";
    
    await supabase
      .from("bulk_messages")
      .update({
        status: finalStatus,
        sent_count: totalSent,
        failed_count: totalFailed,
        sent_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    console.log(`SMS sending complete: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS sent successfully`,
        sent: totalSent,
        failed: totalFailed,
        total: recipients.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-bulk-sms:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
