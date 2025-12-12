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

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, username, userType } = await req.json();

    if (!phone || !username) {
      return new Response(
        JSON.stringify({ success: false, message: "Phone and username are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user exists based on type
    let userPhone = phone;

    if (userType === "learner") {
      const { data: learner } = await supabase
        .from("learners")
        .select("id, first_name, last_name, parent_id")
        .eq("admission_number", username)
        .single();

      if (!learner) {
        return new Response(
          JSON.stringify({ success: false, message: "Learner not found with this admission number" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Get parent phone
      if (learner.parent_id) {
        const { data: parent } = await supabase
          .from("parents")
          .select("phone")
          .eq("id", learner.parent_id)
          .single();
        
        if (parent?.phone) {
          userPhone = parent.phone;
        }
      }
    } else if (userType === "teacher") {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, phone")
        .eq("tsc_number", username)
        .single();

      if (!teacher) {
        return new Response(
          JSON.stringify({ success: false, message: "Teacher not found with this TSC number" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
      if (teacher.phone) {
        userPhone = teacher.phone;
      }
    }

    if (!userPhone) {
      return new Response(
        JSON.stringify({ success: false, message: "No phone number found for this user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const apiKey = Deno.env.get("TEXT_SMS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: "SMS API not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Get school info for message
    const { data: school } = await supabase.from("school_info").select("school_name").single();
    const schoolName = school?.school_name || "School";

    const formattedPhone = formatPhoneNumber(userPhone);
    const message = `Your ${schoolName} password reset OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    // Send SMS via TextSMS
    const smsPayload = {
      apikey: apiKey,
      partnerID: 15265,
      message: message,
      shortcode: schoolName.substring(0, 11),
      mobile: formattedPhone,
    };

    const smsResponse = await fetch("https://sms.textsms.co.ke/api/services/sendsms/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smsPayload),
    });

    const smsResult = await smsResponse.json();
    console.log("SMS API response:", smsResult);

    if (smsResult["response-code"] === 200 || smsResult.responses?.[0]?.["response-code"] === 200) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP sent successfully",
          otp: otp, // Return OTP for verification (in production, store in DB)
          expiresAt: expiresAt,
          phone: formattedPhone.slice(-4) // Return last 4 digits for display
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("SMS sending failed:", smsResult);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to send OTP. Please try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
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
