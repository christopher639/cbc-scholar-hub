import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
      gradeName,
      schoolName 
    }: ApplicationConfirmationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: `${schoolName} <noreply@samge.sc.ke>`,
      to: [parentEmail],
      subject: `Application Received - ${applicationNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Application Received</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear ${parentName},</p>
            
            <p>Thank you for applying to <strong>${schoolName}</strong>. We have received your application for:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 5px 0;"><strong>Application Number:</strong> ${applicationNumber}</p>
              <p style="margin: 5px 0;"><strong>Child's Name:</strong> ${childName}</p>
              <p style="margin: 5px 0;"><strong>Applying for:</strong> ${gradeName}</p>
            </div>
            
            <p>Our admissions team will review your application and get back to you within 5-7 working days. Please keep your application number safe for future reference.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
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
