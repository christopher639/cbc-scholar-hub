import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
      .maybeSingle();

    if (learner) {
      userId = learner.id;
      detectedUserType = "learner";
      
      // Get parent phone for learner
      if (learner.parent_id) {
        const { data: parent } = await supabase
          .from("parents")
          .select("phone")
          .eq("id", learner.parent_id)
          .maybeSingle();
        
        if (parent?.phone) {
          userPhone = parent.phone;
        }
      }
    } else {
      // Try to find as teacher (by tsc_number or employee_number)
      // First try tsc_number
      let teacher = null;
      const { data: teacherByTsc } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, phone, tsc_number, employee_number")
        .eq("tsc_number", username)
        .maybeSingle();
      
      if (teacherByTsc) {
        teacher = teacherByTsc;
      } else {
        // Try employee_number
        const { data: teacherByEmp } = await supabase
          .from("teachers")
          .select("id, first_name, last_name, phone, tsc_number, employee_number")
          .eq("employee_number", username)
          .maybeSingle();
        teacher = teacherByEmp;
      }

      if (teacher) {
        userId = teacher.id;
        detectedUserType = "teacher";
        if (teacher.phone) {
          userPhone = teacher.phone;
        }
      } else {
        // Try to find as admin user by email
        // First get user from auth.users by email using admin API
        const { data: authData } = await supabase.auth.admin.listUsers();
        const authUser = authData?.users?.find(u => u.email === username);
        
        if (authUser) {
          // Now get profile with phone number
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, phone_number")
            .eq("id", authUser.id)
            .maybeSingle();
          
          if (profile) {
            userId = profile.id;
            detectedUserType = "admin";
            if (profile.phone_number) {
              userPhone = profile.phone_number;
            }
          }
        }
      }
    }

    console.log("User lookup result:", { userId, detectedUserType, hasPhone: !!userPhone });

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get user email for fallback
    let userEmail = "";
    if (detectedUserType === "teacher") {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      userEmail = teacher?.email || "";
    } else if (detectedUserType === "admin") {
      const authUser = (await supabase.auth.admin.listUsers()).data?.users?.find(u => u.email === username);
      userEmail = authUser?.email || "";
    }
    // Learners don't have email, they use parent's phone

    if (!userPhone && !userEmail) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          no_phone: true,
          message: "No phone number or email associated with this account",
          userId: userId,
          userType: detectedUserType
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Generate OTP with 5 minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Get school info for message
    const { data: school } = await supabase.from("school_info").select("school_name").single();
    const schoolName = school?.school_name || "School";
    const messageType = is2FAMode ? "login verification" : "password reset";

    // Try SMS first if phone is available
    if (userPhone) {
      const apiKey = Deno.env.get("TEXT_SMS_API_KEY");
      if (apiKey) {
        const formattedPhone = formatPhoneNumber(userPhone);
        const message = `Your ${schoolName} ${messageType} OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;

        const smsPayload = {
          apikey: apiKey,
          partnerID: 15265,
          message: message,
          shortcode: "TextSMS",
          mobile: formattedPhone,
        };

        console.log("Sending OTP via SMS to:", formattedPhone.slice(-4));

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
              message: "OTP sent successfully via SMS",
              otp: otp,
              userId: userId,
              userType: detectedUserType,
              expiresAt: expiresAt,
              phone: formattedPhone.slice(-4),
              deliveryMethod: "sms"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.error("SMS sending failed, trying email fallback:", smsResult);
      }
    }

    // Fallback to email if no phone or SMS failed
    if (userEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ success: false, message: "Email API not configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const resend = new Resend(resendApiKey);
      console.log("Sending OTP via email to:", userEmail);

      const emailResponse = await resend.emails.send({
        from: `${schoolName} <onboarding@resend.dev>`,
        to: [userEmail],
        subject: `Your ${messageType} OTP Code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Your ${messageType} OTP Code</h2>
            <p>Hello,</p>
            <p>Your one-time verification code for ${schoolName} is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
            </div>
            <p style="color: #666;">This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      });

      if (emailResponse.error) {
        console.error("Email sending failed:", emailResponse.error);
        return new Response(
          JSON.stringify({ success: false, message: "Failed to send OTP. Please try again." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      console.log("Email sent successfully:", emailResponse);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP sent successfully via email",
          otp: otp,
          userId: userId,
          userType: detectedUserType,
          expiresAt: expiresAt,
          email: userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
          deliveryMethod: "email"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Failed to send OTP. No valid contact method available." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
