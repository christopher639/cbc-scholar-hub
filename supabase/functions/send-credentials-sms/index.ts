import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { type, phone, credentials } = await req.json();

    if (!type || !phone || !credentials) {
      return new Response(
        JSON.stringify({ success: false, message: "Type, phone, and credentials are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const apiKey = Deno.env.get("TEXT_SMS_API_KEY");
    if (!apiKey) {
      console.log("SMS API not configured, skipping SMS send");
      return new Response(
        JSON.stringify({ success: true, message: "SMS skipped - API not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get school info
    const { data: school } = await supabase.from("school_info").select("school_name").single();
    const schoolName = school?.school_name || "School";

    const formattedPhone = formatPhoneNumber(phone);
    let message = "";

    if (type === "learner") {
      // Credentials for learner (sent to parent)
      message = `Welcome to ${schoolName}! Your child ${credentials.learnerName} has been enrolled. Login credentials - Username: ${credentials.admissionNumber}, Password: ${credentials.birthCertificate || "Contact admin"}. Portal: ${credentials.portalUrl || "school website"}`;
    } else if (type === "teacher") {
      // Credentials for teacher
      message = `Welcome to ${schoolName}! Your teacher account has been created. Login credentials - Username (TSC): ${credentials.tscNumber}, Password (ID): ${credentials.idNumber}. Portal: ${credentials.portalUrl || "school website"}`;
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid type specified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Send SMS via TextSMS
    const smsPayload = {
      apikey: apiKey,
      partnerID: 15265,
      message: message,
      shortcode: schoolName.substring(0, 11),
      mobile: formattedPhone,
    };

    console.log("Sending credentials SMS to:", formattedPhone);

    const smsResponse = await fetch("https://sms.textsms.co.ke/api/services/sendsms/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smsPayload),
    });

    const smsResult = await smsResponse.json();
    console.log("SMS API response:", smsResult);

    if (smsResult["response-code"] === 200 || smsResult.responses?.[0]?.["response-code"] === 200) {
      return new Response(
        JSON.stringify({ success: true, message: "Credentials sent via SMS successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("SMS sending failed:", smsResult);
      // Don't fail the whole operation, just log the error
      return new Response(
        JSON.stringify({ success: true, message: "User created but SMS delivery may have failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
