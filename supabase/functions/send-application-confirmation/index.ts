import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationConfirmationRequest {
  parentEmail: string;
  parentName: string;
  childName: string;
  applicationNumber: string;
  gradeName: string;
  schoolName: string;
  interviewEnabled?: boolean;
  interviewDate?: string | null;
  interviewTime?: string | null;
  interviewLocation?: string | null;
  interviewRequirements?: string | null;
  interviewFee?: number | null;
  interviewFeeNote?: string | null;
  applicationFee?: number | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      parentEmail, 
      parentName, 
      childName, 
      applicationNumber, 
      gradeName,
      schoolName,
      interviewEnabled,
      interviewDate,
      interviewTime,
      interviewLocation,
      interviewRequirements,
      interviewFee,
      interviewFeeNote,
      applicationFee
    }: ApplicationConfirmationRequest = await req.json();

    console.log("Sending application confirmation to:", parentEmail);
    console.log("Interview enabled:", interviewEnabled);

    // Get school logo
    const { data: school } = await supabase.from("school_info").select("logo_url").single();
    const schoolLogo = school?.logo_url || "";

    // Build interview section if enabled
    let interviewSection = "";
    if (interviewEnabled) {
      interviewSection = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #92400e;">📅 Interview Invitation</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${interviewDate || "To be announced"}</p>
          ${interviewTime ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${interviewTime}</p>` : ""}
          ${interviewLocation ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${interviewLocation}</p>` : ""}
          ${interviewRequirements ? `
            <div style="margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Requirements:</strong></p>
              <p style="margin: 5px 0; color: #666; white-space: pre-line;">${interviewRequirements}</p>
            </div>
          ` : ""}
          ${interviewFee && interviewFee > 0 ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fcd34d;">
              <p style="margin: 5px 0;"><strong>Interview Fee:</strong> KES ${interviewFee.toLocaleString()}</p>
              ${interviewFeeNote ? `<p style="margin: 5px 0; font-size: 12px; color: #92400e; font-style: italic;">${interviewFeeNote}</p>` : ""}
            </div>
          ` : ""}
        </div>
      `;
    }

    // Build application fee section
    let applicationFeeSection = "";
    if (applicationFee && applicationFee > 0) {
      applicationFeeSection = `
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Application Fee:</strong> KES ${applicationFee.toLocaleString()}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #1e40af;">Please pay the application fee to complete your application process.</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: `${schoolName} <noreply@samge.sc.ke>`,
      to: [parentEmail],
      subject: `Application Received - ${applicationNumber}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 40px; text-align: center;">
                      ${schoolLogo ? `
                        <img src="${schoolLogo}" alt="${schoolName}" style="max-height: 70px; max-width: 200px; margin-bottom: 12px;">
                      ` : `
                        <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center;">
                          <span style="color: white; font-size: 28px; font-weight: bold;">${schoolName.charAt(0)}</span>
                        </div>
                      `}
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">${schoolName}</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Application Received</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 16px 0; color: #475569; font-size: 16px;">Dear ${parentName},</p>
                      
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Thank you for applying to <strong>${schoolName}</strong>. We have received your application for:
                      </p>
                      
                      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <p style="margin: 5px 0;"><strong>Application Number:</strong> ${applicationNumber}</p>
                        <p style="margin: 5px 0;"><strong>Child's Name:</strong> ${childName}</p>
                        <p style="margin: 5px 0;"><strong>Applying for:</strong> ${gradeName}</p>
                      </div>
                      
                      ${interviewSection}
                      ${applicationFeeSection}
                      
                      <p style="margin: 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Our admissions team will review your application and get back to you within 5-7 working days. Please keep your application number safe for future reference.
                      </p>
                      
                      <p style="margin: 16px 0; color: #475569; font-size: 15px;">
                        If you have any questions, please don't hesitate to contact us.
                      </p>
                      
                      <p style="margin-top: 30px; color: #475569;">
                        Best regards,<br>
                        <strong>Admissions Team</strong><br>
                        ${schoolName}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0; color: #64748b; font-size: 13px;">This is an official communication from ${schoolName}</p>
                      <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">Please do not reply directly to this email.</p>
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

    console.log("Application confirmation email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending application confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);