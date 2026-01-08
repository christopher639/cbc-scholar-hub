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

    // Get school info including logo
    const { data: school } = await supabase.from("school_info").select("school_name, logo_url").single();
    const schoolName = school?.school_name || "School";
    const schoolLogo = school?.logo_url || "";

    let smsSent = false;
    let emailSent = false;

    // Prepare message based on notification type
    let smsMessage = "";
    let emailSubject = "";
    let emailHtml = "";

    const loginUrl = "https://samge.sc.ke/auth";

    if (notificationType === "account_created") {
      smsMessage = `Hello ${fullName || "User"}! Your ${schoolName} account has been created. Please wait for admin approval. If it takes too long, please contact the school admin. You will be notified once verified.`;
      emailSubject = `Account Created - ${schoolName}`;
      emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Created</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 40px; text-align: center;">
                      ${schoolLogo ? `
                        <img src="${schoolLogo}" alt="${schoolName}" style="max-height: 70px; max-width: 200px; margin-bottom: 12px;">
                      ` : `
                        <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center;">
                          <span style="color: white; font-size: 28px; font-weight: bold;">${schoolName.charAt(0)}</span>
                        </div>
                      `}
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">${schoolName}</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px;">Welcome to ${schoolName}!</h2>
                      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">Hello ${fullName || "User"},</p>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">Your account has been created successfully.</p>
                      
                      <div style="background-color: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; color: #92400e; font-weight: 600;">⏳ Status: Pending Verification</p>
                        <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">Please wait for admin approval. You will receive another notification once your account is verified and activated.</p>
                      </div>
                      
                      <p style="color: #64748b; font-size: 14px; font-style: italic;">If it's taking too long, please contact the school administration directly.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0; color: #64748b; font-size: 13px;">This is an official communication from ${schoolName}</p>
                      <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else if (notificationType === "account_verified") {
      smsMessage = `Hello ${fullName || "User"}! Great news! Your ${schoolName} account has been verified and activated. You can now login to access your portal.`;
      emailSubject = `Account Verified - ${schoolName}`;
      emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verified</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 40px; text-align: center;">
                      ${schoolLogo ? `
                        <img src="${schoolLogo}" alt="${schoolName}" style="max-height: 70px; max-width: 200px; margin-bottom: 12px;">
                      ` : `
                        <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center;">
                          <span style="color: white; font-size: 28px; font-weight: bold;">${schoolName.charAt(0)}</span>
                        </div>
                      `}
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">${schoolName}</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #22c55e; font-size: 24px;">🎉 Account Verified!</h2>
                      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">Hello ${fullName || "User"},</p>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">Great news! Your ${schoolName} account has been verified and activated.</p>
                      
                      <div style="background-color: #dcfce7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #22c55e;">
                        <p style="margin: 0; color: #166534; font-weight: 600;">✅ Status: Active</p>
                        <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">You can now login to access your portal.</p>
                      </div>
                      
                      <!-- Login Button -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                          Login to Portal
                        </a>
                      </div>
                      
                      <p style="color: #64748b; font-size: 14px; text-align: center;">Thank you for being part of our school community!</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0; color: #64748b; font-size: 13px;">This is an official communication from ${schoolName}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
          const fromAddress = `${schoolName} <noreply@samge.sc.ke>`;

          console.log("Sending account notification email to:", email, "from:", fromAddress);

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