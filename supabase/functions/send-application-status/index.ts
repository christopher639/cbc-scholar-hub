import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { 
      parentEmail, 
      parentName, 
      childName, 
      applicationNumber, 
      status,
      rejectionReason,
      schoolName 
    }: ApplicationStatusRequest = await req.json();

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
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${isApproved ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">
              ${isApproved ? '🎉 Application Approved!' : 'Application Update'}
            </h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear ${parentName},</p>
            
            ${isApproved ? `
              <p>We are pleased to inform you that the application for <strong>${childName}</strong> has been <strong style="color: #22c55e;">APPROVED</strong>!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <p style="margin: 5px 0;"><strong>Application Number:</strong> ${applicationNumber}</p>
                <p style="margin: 5px 0;"><strong>Child's Name:</strong> ${childName}</p>
              </div>
              
              <p>Our admissions team will contact you shortly with the next steps for enrollment, including:</p>
              <ul>
                <li>Required documents</li>
                <li>Fee payment details</li>
                <li>Orientation schedule</li>
              </ul>
              
              <p>We look forward to welcoming ${childName} to our school community!</p>
            ` : `
              <p>We regret to inform you that the application for <strong>${childName}</strong> could not be approved at this time.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 5px 0;"><strong>Application Number:</strong> ${applicationNumber}</p>
                <p style="margin: 5px 0;"><strong>Child's Name:</strong> ${childName}</p>
                ${rejectionReason ? `<p style="margin: 10px 0 5px 0;"><strong>Reason:</strong></p><p style="margin: 5px 0; color: #666;">${rejectionReason}</p>` : ''}
              </div>
              
              <p>If you have any questions or would like to discuss this decision, please feel free to contact our admissions office.</p>
            `}
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>Admissions Team</strong><br>
              ${schoolName}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
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
