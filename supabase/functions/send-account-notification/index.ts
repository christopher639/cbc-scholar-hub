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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, notificationType, email: providedEmail, phone: providedPhone, fullName: providedName } = await req.json();

    // notificationType: "account_created" or "account_verified"

    if (!userId || !notificationType) {
      return new Response(
        JSON.stringify({ success: false, message: "User ID and notification type are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user email from auth.users table
    let email = providedEmail;
    let phone = providedPhone;
    let fullName = providedName;

    // Try to get user info from auth.users if not provided
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user) {
      if (!email) email = authUser.user.email;
      if (!phone) phone = authUser.user.phone || authUser.user.user_metadata?.phone_number;
      if (!fullName) fullName = authUser.user.user_metadata?.full_name;
    }

    // Also try to get phone from profiles if still not available
    if (!phone) {
      const { data: profile } = await supabase.from("profiles").select("phone_number, full_name").eq("id", userId).single();
      if (profile) {
        if (!phone) phone = profile.phone_number;
        if (!fullName) fullName = profile.full_name;
      }
    }

    // Get school info
    const { data: school } = await supabase.from("school_info").select("school_name").single();
    const schoolName = school?.school_name || "School";

    let smsSent = false;
    let emailSent = false;

    // Prepare message based on notification type
    let smsMessage = "";
    let emailSubject = "";
    let emailHtml = "";

    if (notificationType === "account_created") {
      smsMessage = `Hello ${fullName || "User"}! Your ${schoolName} account has been created. Please wait for admin approval. If it takes too long, please contact the school admin. You will be notified once verified.`;
      emailSubject = `Account Created - ${schoolName}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to ${schoolName}!</h2>
          <p>Hello ${fullName || "User"},</p>
          <p>Your account has been created successfully.</p>
          <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; color: #666;"><strong>Status:</strong> Pending Verification</p>
          </div>
          <p>Please wait for admin approval. You will receive another notification once your account is verified and activated.</p>
          <p style="color: #666; font-style: italic;">If it's taking too long, please contact the school administration directly.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't create this account, please ignore this email.</p>
        </div>
      `;
    } else if (notificationType === "account_verified") {
      smsMessage = `Hello ${fullName || "User"}! Great news! Your ${schoolName} account has been verified and activated. You can now login to access your portal.`;
      emailSubject = `Account Verified - ${schoolName}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #22c55e;">Account Verified!</h2>
          <p>Hello ${fullName || "User"},</p>
          <p>Great news! Your ${schoolName} account has been verified and activated.</p>
          <div style="background-color: #dcfce7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; color: #166534;"><strong>Status:</strong> Active</p>
          </div>
          <p>You can now login to access your portal. Click the button below to login:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/auth" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Login Now
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">Thank you for being part of our school community!</p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid notification type" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Send SMS if phone is available
    if (phone) {
      const apiKey = Deno.env.get("TEXT_SMS_API_KEY");
      if (apiKey) {
        const formattedPhone = formatPhoneNumber(phone);
        const smsPayload = {
          apikey: apiKey,
          partnerID: 15265,
          message: smsMessage,
          shortcode: "TextSMS",
          mobile: formattedPhone,
        };

        console.log("Sending notification SMS to:", formattedPhone.slice(-4));

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
          } else {
            console.error("SMS sending failed:", smsResult);
          }
        } catch (smsError) {
          console.error("SMS error:", smsError);
        }
      }
    }

    // Send email if available
    if (email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        console.log("Sending notification email to:", email);

        try {
          // Get school email for verified domain
          const { data: schoolDetails } = await supabase.from("school_info").select("email").single();
          const schoolFromEmail = schoolDetails?.email;
          
          // Determine from address - use verified school domain email or default
          const isVerifiedDomain = schoolFromEmail && 
            !schoolFromEmail.includes("gmail.com") && 
            !schoolFromEmail.includes("yahoo.com") && 
            !schoolFromEmail.includes("hotmail.com") &&
            !schoolFromEmail.includes("outlook.com");
          const fromAddress = isVerifiedDomain 
            ? `${schoolName} <noreply@${schoolFromEmail.split('@')[1]}>`
            : `${schoolName} <onboarding@resend.dev>`;

          console.log("Using from address:", fromAddress);

          const emailResponse = await resend.emails.send({
            from: fromAddress,
            to: [email],
            subject: emailSubject,
            html: emailHtml,
          });

          if (!emailResponse.error) {
            emailSent = true;
            console.log("Email sent successfully:", emailResponse);
          } else {
            console.error("Email sending failed:", emailResponse.error);
          }
        } catch (emailError) {
          console.error("Email error:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        smsSent,
        emailSent,
        message: smsSent || emailSent ? "Notification sent" : "No notifications sent (missing contact info or API keys)"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
