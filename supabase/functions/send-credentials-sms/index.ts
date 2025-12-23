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
    const { type, phone, email, credentials } = await req.json();

    if (!type || !credentials) {
      return new Response(
        JSON.stringify({ success: false, message: "Type and credentials are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const smsApiKey = Deno.env.get("TEXT_SMS_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Get school info
    const { data: school } = await supabase.from("school_info").select("school_name").single();
    const schoolName = school?.school_name || "School";

    let smsMessage = "";
    let emailSubject = "";
    let emailHtml = "";

    if (type === "learner") {
      // Credentials for learner (sent to parent)
      smsMessage = `Welcome to ${schoolName}! Your child ${credentials.learnerName} has been enrolled. Login: Username: ${credentials.admissionNumber}, Password: ${credentials.birthCertificate || "Contact admin"}. Portal: ${credentials.portalUrl}. Please change password on first login.`;
      emailSubject = `${schoolName} - Learner Portal Credentials`;
      emailHtml = `
        <h2>Welcome to ${schoolName}!</h2>
        <p>Your child <strong>${credentials.learnerName}</strong> has been successfully enrolled.</p>
        <h3>Login Credentials:</h3>
        <ul>
          <li><strong>Username:</strong> ${credentials.admissionNumber}</li>
          <li><strong>Password:</strong> ${credentials.birthCertificate || "Contact admin"}</li>
        </ul>
        <p>Portal URL: <a href="${credentials.portalUrl}">${credentials.portalUrl}</a></p>
        <p><strong>Important:</strong> Please change the password on first login for security.</p>
        <p>Best regards,<br>${schoolName}</p>
      `;
    } else if (type === "teacher") {
      // Credentials for teacher
      smsMessage = `Welcome to ${schoolName}! Dear ${credentials.name}, your teacher account is ready. Employee No: ${credentials.employeeNumber}. Login: Username (TSC): ${credentials.tscNumber}, Password (ID): ${credentials.idNumber}. Portal: ${credentials.portalUrl}. IMPORTANT: Change your password on first login.`;
      emailSubject = `${schoolName} - Teacher Portal Credentials`;
      emailHtml = `
        <h2>Welcome to ${schoolName}!</h2>
        <p>Dear <strong>${credentials.name}</strong>, your teacher account has been created successfully.</p>
        <h3>Your Details:</h3>
        <ul>
          <li><strong>Employee Number:</strong> ${credentials.employeeNumber}</li>
        </ul>
        <h3>Login Credentials:</h3>
        <ul>
          <li><strong>Username (TSC Number):</strong> ${credentials.tscNumber}</li>
          <li><strong>Password (ID Number):</strong> ${credentials.idNumber}</li>
        </ul>
        <p>Portal URL: <a href="${credentials.portalUrl}">${credentials.portalUrl}</a></p>
        <p><strong>IMPORTANT:</strong> For security reasons, please change your password immediately after your first login.</p>
        <p>Best regards,<br>${schoolName}</p>
      `;
    } else if (type === "staff") {
      // Credentials for non-teaching staff
      smsMessage = `Welcome to ${schoolName}! Dear ${credentials.name}, your staff account is ready. Employee No: ${credentials.employeeNumber}. Login: Username: ${credentials.employeeNumber}, Password (ID): ${credentials.idNumber}. Portal: ${credentials.portalUrl}. IMPORTANT: Change your password on first login.`;
      emailSubject = `${schoolName} - Staff Portal Credentials`;
      emailHtml = `
        <h2>Welcome to ${schoolName}!</h2>
        <p>Dear <strong>${credentials.name}</strong>, your staff account has been created successfully.</p>
        <h3>Your Details:</h3>
        <ul>
          <li><strong>Employee Number:</strong> ${credentials.employeeNumber}</li>
          <li><strong>Position:</strong> ${credentials.jobTitle}</li>
        </ul>
        <h3>Login Credentials:</h3>
        <ul>
          <li><strong>Username (Employee Number):</strong> ${credentials.employeeNumber}</li>
          <li><strong>Password (ID Number):</strong> ${credentials.idNumber}</li>
        </ul>
        <p>Portal URL: <a href="${credentials.portalUrl}">${credentials.portalUrl}</a></p>
        <p><strong>IMPORTANT:</strong> For security reasons, please change your password immediately after your first login.</p>
        <p>Best regards,<br>${schoolName}</p>
      `;
    } else if (type === "user") {
      // Credentials for admin-created users
      const roleLabel = credentials.role === "admin" ? "Administrator" : 
                        credentials.role === "finance" ? "Finance Officer" :
                        credentials.role === "teacher" ? "Teacher" :
                        credentials.role === "parent" ? "Parent" :
                        credentials.role === "learner" ? "Learner" : "User";
      
      smsMessage = `Welcome to ${schoolName}! Dear ${credentials.name}, your ${roleLabel} account is ready. Login: Email: ${credentials.email}, Password: ${credentials.password}. Portal: ${credentials.portalUrl}. IMPORTANT: Change your password on first login.`;
      emailSubject = `${schoolName} - Your Account Credentials`;
      emailHtml = `
        <h2>Welcome to ${schoolName}!</h2>
        <p>Dear <strong>${credentials.name}</strong>, your account has been created successfully.</p>
        <h3>Account Details:</h3>
        <ul>
          <li><strong>Role:</strong> ${roleLabel}</li>
        </ul>
        <h3>Login Credentials:</h3>
        <ul>
          <li><strong>Email:</strong> ${credentials.email}</li>
          <li><strong>Password:</strong> ${credentials.password}</li>
        </ul>
        <p>Portal URL: <a href="${credentials.portalUrl}">${credentials.portalUrl}</a></p>
        <p><strong>IMPORTANT:</strong> For security reasons, please change your password immediately after your first login.</p>
        <p>Best regards,<br>${schoolName}</p>
      `;
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid type specified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let smsSent = false;
    let emailSent = false;

    // Send SMS if phone is provided and API key is configured
    if (phone && smsApiKey) {
      const formattedPhone = formatPhoneNumber(phone);
      const smsPayload = {
        apikey: smsApiKey,
        partnerID: 15265,
        message: smsMessage.substring(0, 320), // Allow 2 SMS parts
        shortcode: schoolName.substring(0, 11),
        mobile: formattedPhone,
      };

      console.log("Sending credentials SMS to:", formattedPhone);

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
        }
      } catch (smsError) {
        console.error("SMS sending error:", smsError);
      }
    }

    // Send Email if email is provided and API key is configured
    if (email && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const emailResponse = await resend.emails.send({
          from: `${schoolName} <onboarding@resend.dev>`,
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        });
        console.log("Email sent:", emailResponse);
        emailSent = true;
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }
    }

    const message = smsSent && emailSent 
      ? "Credentials sent via SMS and Email" 
      : smsSent 
        ? "Credentials sent via SMS" 
        : emailSent 
          ? "Credentials sent via Email" 
          : "User created but credential delivery may have failed";

    return new Response(
      JSON.stringify({ success: true, message, smsSent, emailSent }),
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
