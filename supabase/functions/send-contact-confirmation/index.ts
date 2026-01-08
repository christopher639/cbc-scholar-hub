import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message } = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and name are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get school info including logo
    const { data: school } = await supabase.from("school_info").select("school_name, phone, email, logo_url").single();
    const schoolName = school?.school_name || "School";
    const schoolPhone = school?.phone || "";
    const schoolEmail = school?.email || "";
    const schoolLogo = school?.logo_url || "";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    console.log("Sending contact confirmation email to:", email);

    // Use verified domain email
    const fromAddress = `${schoolName} <noreply@samge.sc.ke>`;

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `Thank you for contacting ${schoolName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Contacting Us</title>
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
                      <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px;">Thank You for Contacting Us!</h2>
                      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Your message has been received. Thank you for reaching out to <strong>${schoolName}</strong>.
                      </p>
                      
                      <div style="background-color: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0 0 10px 0; color: #64748b; font-weight: 600;">Your Message:</p>
                        <p style="margin: 0; color: #475569; font-style: italic;">"${message || 'No message content'}"</p>
                      </div>
                      
                      <p style="margin: 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Our receptionist will review your inquiry and get back to you as soon as possible.
                      </p>
                      
                      <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0; color: #0369a1; font-weight: 600;">Need immediate assistance?</p>
                        ${schoolPhone ? `<p style="margin: 4px 0; color: #0c4a6e; font-size: 14px;">📞 Call us: ${schoolPhone}</p>` : ''}
                        ${schoolEmail ? `<p style="margin: 4px 0; color: #0c4a6e; font-size: 14px;">📧 Email: ${schoolEmail}</p>` : ''}
                      </div>
                      
                      <p style="margin-top: 24px; color: #64748b;">
                        Best regards,<br>
                        <strong>${schoolName} Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px;">This is an automated response. Please do not reply directly to this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Email sending failed:", emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to send confirmation email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Contact confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent" }),
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