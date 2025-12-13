import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyRequest {
  contactMessageId: string;
  replyMessage: string;
}

const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactMessageId, replyMessage }: ReplyRequest = await req.json();

    if (!contactMessageId || !replyMessage) {
      throw new Error("Missing required fields: contactMessageId and replyMessage");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smsApiKey = Deno.env.get("TEXT_SMS_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the contact message
    const { data: contactMessage, error: msgError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", contactMessageId)
      .single();

    if (msgError || !contactMessage) {
      throw new Error("Contact message not found");
    }

    // Fetch school info for branding
    const { data: schoolInfo } = await supabase
      .from("school_info")
      .select("school_name, email")
      .single();

    const schoolName = schoolInfo?.school_name || "School";
    const results = { sms: false, email: false };

    // Send SMS if phone number exists
    if (contactMessage.phone && smsApiKey) {
      const formattedPhone = formatPhoneNumber(contactMessage.phone);
      const smsMessage = `Hello ${contactMessage.name}, ${replyMessage} - ${schoolName}`;

      try {
        const smsResponse = await fetch("https://sms.textsms.co.ke/api/services/sendsms/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apikey: smsApiKey,
            partnerID: "15265",
            message: smsMessage,
            shortcode: "TextSMS",
            mobile: formattedPhone,
          }),
        });

        const smsResult = await smsResponse.json();
        console.log("SMS response:", smsResult);
        results.sms = smsResult["response-code"] === 200 || smsResult.responses?.[0]?.["response-code"] === 200;
      } catch (smsError) {
        console.error("SMS sending error:", smsError);
      }
    }

    // Send email
    if (contactMessage.email && resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${schoolName} <onboarding@resend.dev>`,
            to: [contactMessage.email],
            subject: `Reply from ${schoolName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello ${contactMessage.name},</h2>
                <p style="color: #555; line-height: 1.6;">${replyMessage}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #888; font-size: 12px;">This is a reply to your inquiry sent on ${new Date(contactMessage.created_at).toLocaleDateString()}.</p>
                <p style="color: #888; font-size: 12px;">Best regards,<br/>${schoolName}</p>
              </div>
            `,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log("Email response:", emailResult);
        results.email = emailResponse.ok;
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }
    }

    // Mark as read if not already
    if (!contactMessage.is_read) {
      await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", contactMessageId);
    }

    const successMessages = [];
    if (results.sms) successMessages.push("SMS");
    if (results.email) successMessages.push("email");

    if (successMessages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Failed to send reply via any channel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reply sent via ${successMessages.join(" and ")}`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-reply-message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
