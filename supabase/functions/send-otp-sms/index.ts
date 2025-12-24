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
    let userEmail = "";

    // Try to find as learner first (by admission number)
    const { data: learnerByAdmission } = await supabase
      .from("learners")
      .select("id, first_name, last_name, parent_id")
      .eq("admission_number", username)
      .maybeSingle();

    if (learnerByAdmission) {
      userId = learnerByAdmission.id;
      detectedUserType = "learner";
      
      // Get parent phone and email for learner
      if (learnerByAdmission.parent_id) {
        const { data: parent } = await supabase
          .from("parents")
          .select("phone, email")
          .eq("id", learnerByAdmission.parent_id)
          .maybeSingle();
        
        if (parent) {
          userPhone = parent.phone || "";
          userEmail = parent.email || "";
        }
      }
    } else {
      // Try to find learner by birth certificate number
      const { data: learnerByBirthCert } = await supabase
        .from("learners")
        .select("id, first_name, last_name, parent_id")
        .eq("birth_certificate_number", username)
        .maybeSingle();

      if (learnerByBirthCert) {
        userId = learnerByBirthCert.id;
        detectedUserType = "learner";
        
        // Get parent phone and email for learner
        if (learnerByBirthCert.parent_id) {
          const { data: parent } = await supabase
            .from("parents")
            .select("phone, email")
            .eq("id", learnerByBirthCert.parent_id)
            .maybeSingle();
          
          if (parent) {
            userPhone = parent.phone || "";
            userEmail = parent.email || "";
          }
        }
      } else {
        // Try to find as teacher (by tsc_number or employee_number)
        let teacher = null;
        const { data: teacherByTsc } = await supabase
          .from("teachers")
          .select("id, first_name, last_name, phone, email, tsc_number, employee_number")
          .eq("tsc_number", username)
          .maybeSingle();
        
        if (teacherByTsc) {
          teacher = teacherByTsc;
        } else {
          // Try employee_number
          const { data: teacherByEmp } = await supabase
            .from("teachers")
            .select("id, first_name, last_name, phone, email, tsc_number, employee_number")
            .eq("employee_number", username)
            .maybeSingle();
          teacher = teacherByEmp;
        }

        if (teacher) {
          userId = teacher.id;
          detectedUserType = "teacher";
          userPhone = teacher.phone || "";
          userEmail = teacher.email || "";
        } else {
          // Try to find as non-teaching staff by employee_number
          const { data: staff } = await supabase
            .from("non_teaching_staff")
            .select("id, first_name, last_name, phone, email, employee_number")
            .eq("employee_number", username)
            .maybeSingle();

          if (staff) {
            userId = staff.id;
            detectedUserType = "employee";
            userPhone = staff.phone || "";
            userEmail = staff.email || "";
          } else {
            // Try to find as admin user by email
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
                userPhone = profile.phone_number || "";
                userEmail = authUser.email || "";
              }
            }
          }
        }
      }
    }

    console.log("User lookup result:", { userId, detectedUserType, hasPhone: !!userPhone, hasEmail: !!userEmail });

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found. Please check your details." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

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

    // Get school info for message and 2FA method preference
    const { data: school } = await supabase.from("school_info").select("school_name, two_factor_method, email").single();
    const schoolName = school?.school_name || "School";
    const twoFactorMethod = school?.two_factor_method || "both"; // Default to 'both' if not set
    const schoolEmail = school?.email;
    const messageType = is2FAMode ? "login verification" : "password reset";

    console.log("2FA method configured:", twoFactorMethod);

    let smsSent = false;
    let emailSent = false;
    let formattedPhone = "";
    let maskedEmail = "";
    const deliveryMethods: string[] = [];

    // Send SMS if phone is available AND method allows SMS
    const shouldSendSms = twoFactorMethod === 'sms' || twoFactorMethod === 'both';
    if (userPhone && shouldSendSms) {
      const apiKey = Deno.env.get("TEXT_SMS_API_KEY");
      if (apiKey) {
        formattedPhone = formatPhoneNumber(userPhone);
        const message = `Your ${schoolName} ${messageType} OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;

        const smsPayload = {
          apikey: apiKey,
          partnerID: 15265,
          message: message,
          shortcode: "TextSMS",
          mobile: formattedPhone,
        };

        console.log("Sending OTP via SMS to:", formattedPhone.slice(-4));

        try {
          const smsResponse = await fetch("https://sms.textsms.co.ke/api/services/sendsms/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(smsPayload),
          });

          const smsResult = await smsResponse.json();
          console.log("SMS API response:", smsResult);

          if (smsResult["response-code"] === 200 || smsResult.responses?.[0]?.["response-code"] === 200) {
            smsSent = true;
            deliveryMethods.push("sms");
          } else {
            console.error("SMS sending failed:", smsResult);
          }
        } catch (smsError) {
          console.error("SMS error:", smsError);
        }
      }
    }

    // Send email if available AND method allows email
    const shouldSendEmail = twoFactorMethod === 'email' || twoFactorMethod === 'both';
    if (userEmail && shouldSendEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        console.log("Sending OTP via email to:", userEmail);

        try {
          // Determine from address - use verified school domain email or default
          const isVerifiedDomain = schoolEmail && 
            !schoolEmail.includes("gmail.com") && 
            !schoolEmail.includes("yahoo.com") && 
            !schoolEmail.includes("hotmail.com") &&
            !schoolEmail.includes("outlook.com");
          const fromAddress = isVerifiedDomain 
            ? `${schoolName} <noreply@${schoolEmail.split('@')[1]}>`
            : `${schoolName} <onboarding@resend.dev>`;
          
          console.log("Using from address:", fromAddress);

          const emailResponse = await resend.emails.send({
            from: fromAddress,
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

          if (!emailResponse.error) {
            emailSent = true;
            maskedEmail = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
            deliveryMethods.push("email");
            console.log("Email sent successfully:", emailResponse);
          } else {
            console.error("Email sending failed:", emailResponse.error);
          }
        } catch (emailError) {
          console.error("Email error:", emailError);
        }
      }
    }

    // Check if at least one method succeeded
    if (smsSent || emailSent) {
      let successMessage = "OTP sent successfully";
      if (smsSent && emailSent) {
        successMessage = "OTP sent to both phone and email";
      } else if (smsSent) {
        successMessage = "OTP sent via SMS";
      } else {
        successMessage = "OTP sent via email";
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: successMessage,
          otp: otp,
          userId: userId,
          userType: detectedUserType,
          expiresAt: expiresAt,
          phone: smsSent ? formattedPhone.slice(-4) : "",
          email: emailSent ? maskedEmail : "",
          deliveryMethod: deliveryMethods.length > 1 ? "both" : deliveryMethods[0],
          deliveryMethods: deliveryMethods
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: If OTP failed to send to ANY channel, return failure to block login
    return new Response(
      JSON.stringify({ 
        success: false, 
        otpFailed: true,
        message: "Failed to send OTP. Unable to verify your identity. Please contact admin or try again later." 
      }),
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
