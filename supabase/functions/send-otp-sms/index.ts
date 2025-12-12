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
    const { phone, username, userType, mode } = await req.json();

    // mode: "forgot_password" or "2fa_login"
    const is2FAMode = mode === "2fa_login";

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, message: "Username is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find user and their phone number based on username
    let userPhone = phone || "";
    let userId = "";
    let detectedUserType = userType;

    // Try to find as learner first (by admission number)
    const { data: learner } = await supabase
      .from("learners")
      .select("id, first_name, last_name, parent_id")
      .eq("admission_number", username)
      .single();

    if (learner) {
      userId = learner.id;
      detectedUserType = "learner";
      
      // Get parent phone for learner
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
    } else {
      // Try to find as teacher (by tsc_number or employee_number)
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, phone, tsc_number, employee_number")
        .or(`tsc_number.eq.${username},employee_number.eq.${username}`)
        .single();

      if (teacher) {
        userId = teacher.id;
        detectedUserType = "teacher";
        if (teacher.phone) {
          userPhone = teacher.phone;
        }
      } else {
        // Try to find as admin user (by email)
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, phone_number")
          .eq("id", username)
          .single();
        
        if (profile) {
          userId = profile.id;
          detectedUserType = "admin";
          if (profile.phone_number) {
            userPhone = profile.phone_number;
          }
        }
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (!userPhone) {
      return new Response(
        JSON.stringify({ success: false, message: "No phone number associated with this account" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Generate OTP with 5 minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

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
    const messageType = is2FAMode ? "login verification" : "password reset";
    const message = `Your ${schoolName} ${messageType} OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;

    // Send SMS via TextSMS
    const smsPayload = {
      apikey: apiKey,
      partnerID: 15265,
      message: message,
      shortcode: "TextSMS",
      mobile: formattedPhone,
    };

    console.log("Sending OTP to:", formattedPhone.slice(-4));

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
          otp: otp,
          userId: userId,
          userType: detectedUserType,
          expiresAt: expiresAt,
          phone: formattedPhone.slice(-4)
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
