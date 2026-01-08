import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationStatusRequest {
  parentEmail: string;
  parentName: string;
  childName: string;
  applicationNumber: string;
  status: "approve" | "reject";
  rejectionReason: string | null;
  schoolName: string;
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
      status,
      rejectionReason,
      schoolName 
    }: ApplicationStatusRequest = await req.json();

    // Get school logo
    const { data: school } = await supabase.from("school_info").select("logo_url").single();
    const schoolLogo = school?.logo_url || "";

    const isApproved = status === "approve";
    const subject = isApproved 
      ? `🎉 Application Approved - ${applicationNumber}`
      : `Application Update - ${applicationNumber}`;

    const emailResponse = await resend.emails.send({
      from: `${schoolName} <noreply@samge.sc.ke>`,
      to: [parentEmail],
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: ${isApproved ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 32px 40px; text-align: center;">
                      ${schoolLogo ? `
                        <img src="${schoolLogo}" alt="${schoolName}" style="max-height: 70px; max-width: 200px; margin-bottom: 12px;">
                      ` : `
                        <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center;">
                          <span style="color: white; font-size: 28px; font-weight: bold;">${schoolName.charAt(0)}</span>
                        </div>
                      `}
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">${schoolName}</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                        ${isApproved ? '🎉 Application Approved!' : 'Application Update'}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 16px 0; color: #475569; font-size: 16px;">Dear ${parentName},</p>
                      
                      ${isApproved ? `
                        <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                          We are pleased to inform you that the application for <strong>${childName}</strong> has been <strong style="color: #22c55e;">APPROVED</strong>!
                        </p>
                        
                        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                          <p style="margin: 5px 0;"><strong>Application Number:</strong> ${applicationNumber}</p>
                          <p style="margin: 5px 0;"><strong>Child's Name:</strong> ${childName}</p>
                        </div>
                        
                        <p style="margin: 16px 0; color: #475569; font-size: 15px;">Our admissions team will contact you shortly with the next steps for enrollment, including:</p>
                        <ul style="color: #475569; font-size: 15px; line-height: 1.8;">
                          <li>Required documents</li>
                          <li>Fee payment details</li>
                          <li>Orientation schedule</li>
                        </ul>
                        
                        <p style="margin: 16px 0; color: #475569; font-size: 15px;">We look forward to welcoming ${childName} to our school community!</p>
                      ` : `
                        <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                          We regret to inform you that the application for <strong>${childName}</strong> could not be approved at this time.
                        </p>
                        
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                          <p style="margin: 5px 0;"><strong>Application Number:</strong> ${applicationNumber}</p>
                          <p style="margin: 5px 0;"><strong>Child's Name:</strong> ${childName}</p>
                          ${rejectionReason ? `<p style="margin: 10px 0 5px 0;"><strong>Reason:</strong></p><p style="margin: 5px 0; color: #666;">${rejectionReason}</p>` : ''}
                        </div>
                        
                        <p style="margin: 16px 0; color: #475569; font-size: 15px;">If you have any questions or would like to discuss this decision, please feel free to contact our admissions office.</p>
                      `}
                      
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

    console.log("Application status email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending application status email:", error);
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