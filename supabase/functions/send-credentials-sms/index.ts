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

interface CredentialEmailParams {
  schoolName: string;
  schoolLogo: string;
  recipientName: string;
  title: string;
  introText: string;
  details?: { label: string; value: string }[];
  credentials: { label: string; value: string }[];
  loginUrl: string;
  footerText: string;
}

const generateCredentialEmailTemplate = (params: CredentialEmailParams): string => {
  const { schoolName, schoolLogo, recipientName, title, introText, details, credentials, loginUrl, footerText } = params;
  
  const detailsHtml = details && details.length > 0 ? `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Your Details</h3>
      ${details.map(d => `<p style="margin: 4px 0; color: #475569;"><strong>${d.label}:</strong> ${d.value}</p>`).join('')}
    </div>
  ` : '';

  const credentialsHtml = credentials.map(c => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">${c.label}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-family: 'Courier New', monospace; font-weight: 600;">${c.value}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
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
                  <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 24px; font-weight: 600;">
                    Hello, ${recipientName}! 👋
                  </h2>
                  <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                    ${introText}
                  </p>
                  
                  ${detailsHtml}
                  
                  <!-- Credentials Box -->
                  <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="margin: 0 0 16px 0; color: #92400e; font-size: 16px; font-weight: 600;">🔐 Login Credentials</h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                      ${credentialsHtml}
                    </table>
                  </div>
                  
                  <!-- Login Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Login to Portal
                    </a>
                  </div>
                  
                  <!-- Important Notice -->
                  <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-top: 24px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>⚠️ Important:</strong> ${footerText}
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                    This is an official communication from ${schoolName}
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    If you have any questions, please contact the school administration.
                  </p>
                </td>
              </tr>
            </table>
            
            <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 11px; text-align: center;">
              © ${new Date().getFullYear()} ${schoolName}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
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

    // Get school info including logo
    const { data: school } = await supabase.from("school_info").select("school_name, email, logo_url").single();
    const schoolName = school?.school_name || "School";
    const schoolEmail = school?.email;
    const schoolLogo = school?.logo_url || "";

    let smsMessage = "";
    let emailSubject = "";
    let emailHtml = "";

    // Login URL for the school portal - pointing to auth page
    const loginUrl = "https://samge.sc.ke/auth";

    if (type === "learner") {
      // Credentials for learner (sent to parent)
      smsMessage = `Welcome to ${schoolName}! Your child ${credentials.learnerName} has been enrolled. Login: Username: ${credentials.admissionNumber}, Password: ${credentials.birthCertificate || "Contact admin"}. Portal: ${loginUrl}. Please change password on first login.`;
      emailSubject = `${schoolName} - Learner Portal Credentials`;
      emailHtml = generateCredentialEmailTemplate({
        schoolName,
        schoolLogo,
        recipientName: credentials.parentName || "Parent/Guardian",
        title: "Learner Portal Credentials",
        introText: `Your child <strong>${credentials.learnerName}</strong> has been successfully enrolled at ${schoolName}.`,
        credentials: [
          { label: "Username", value: credentials.admissionNumber },
          { label: "Password", value: credentials.birthCertificate || "Contact admin" },
        ],
        loginUrl,
        footerText: "Please change the password on first login for security.",
      });
    } else if (type === "teacher") {
      // Credentials for teacher
      smsMessage = `Welcome to ${schoolName}! Dear ${credentials.name}, your teacher account is ready. Employee No: ${credentials.employeeNumber}. Login: Username (TSC): ${credentials.tscNumber}, Password (ID): ${credentials.idNumber}. Portal: ${loginUrl}. IMPORTANT: Change your password on first login.`;
      emailSubject = `${schoolName} - Teacher Portal Credentials`;
      emailHtml = generateCredentialEmailTemplate({
        schoolName,
        schoolLogo,
        recipientName: credentials.name,
        title: "Teacher Portal Credentials",
        introText: `Your teacher account has been created successfully at ${schoolName}.`,
        details: [
          { label: "Employee Number", value: credentials.employeeNumber },
        ],
        credentials: [
          { label: "Username (TSC Number)", value: credentials.tscNumber },
          { label: "Password (ID Number)", value: credentials.idNumber },
        ],
        loginUrl,
        footerText: "For security reasons, please change your password immediately after your first login.",
      });
    } else if (type === "staff") {
      // Credentials for non-teaching staff
      smsMessage = `Welcome to ${schoolName}! Dear ${credentials.name}, your staff account is ready. Employee No: ${credentials.employeeNumber}. Login: Username: ${credentials.employeeNumber}, Password (ID): ${credentials.idNumber}. Portal: ${loginUrl}. IMPORTANT: Change your password on first login.`;
      emailSubject = `${schoolName} - Staff Portal Credentials`;
      emailHtml = generateCredentialEmailTemplate({
        schoolName,
        schoolLogo,
        recipientName: credentials.name,
        title: "Staff Portal Credentials",
        introText: `Your staff account has been created successfully at ${schoolName}.`,
        details: [
          { label: "Employee Number", value: credentials.employeeNumber },
          { label: "Position", value: credentials.jobTitle },
        ],
        credentials: [
          { label: "Username (Employee Number)", value: credentials.employeeNumber },
          { label: "Password (ID Number)", value: credentials.idNumber },
        ],
        loginUrl,
        footerText: "For security reasons, please change your password immediately after your first login.",
      });
    } else if (type === "user") {
      // Credentials for admin-created users
      const roleLabel = credentials.role === "admin" ? "Administrator" : 
                        credentials.role === "finance" ? "Finance Officer" :
                        credentials.role === "teacher" ? "Teacher" :
                        credentials.role === "parent" ? "Parent" :
                        credentials.role === "learner" ? "Learner" : "User";
      
      smsMessage = `Welcome to ${schoolName}! Dear ${credentials.name}, your ${roleLabel} account is ready. Login: Email: ${credentials.email}, Password: ${credentials.password}. Portal: ${loginUrl}. IMPORTANT: Change your password on first login.`;
      emailSubject = `${schoolName} - Your Account Credentials`;
      emailHtml = generateCredentialEmailTemplate({
        schoolName,
        schoolLogo,
        recipientName: credentials.name,
        title: "Your Account Credentials",
        introText: `Your ${roleLabel} account has been created successfully at ${schoolName}.`,
        details: [
          { label: "Role", value: roleLabel },
        ],
        credentials: [
          { label: "Email", value: credentials.email },
          { label: "Password", value: credentials.password },
        ],
        loginUrl,
        footerText: "For security reasons, please change your password immediately after your first login.",
      });
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
        
        // Use verified domain email
        const fromAddress = `${schoolName} <noreply@samge.sc.ke>`;
        
        console.log("Sending credentials email to:", email, "from:", fromAddress);
        
        const emailResponse = await resend.emails.send({
          from: fromAddress,
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        });
        console.log("Email sent:", emailResponse);
        if (!emailResponse.error) {
          emailSent = true;
        }
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