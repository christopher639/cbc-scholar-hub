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

    // Get school info
    const { data: school } = await supabase.from("school_info").select("school_name, phone, email").single();
    const schoolName = school?.school_name || "School";
    const schoolPhone = school?.phone || "";
    const schoolEmail = school?.email || "";

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

    // Determine from address - use school email if from verified domain, otherwise fallback
    const fromAddress = schoolEmail && !schoolEmail.includes("gmail.com") && !schoolEmail.includes("yahoo.com") && !schoolEmail.includes("hotmail.com")
      ? `${schoolName} <${schoolEmail}>`
      : `${schoolName} <onboarding@resend.dev>`;

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `Thank you for contacting ${schoolName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Thank You for Contacting Us!</h2>
          <p>Dear ${name},</p>
          <p>Your message has been received. Thank you for reaching out to <strong>${schoolName}</strong>.</p>
          
          <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; color: #666;"><strong>Your Message:</strong></p>
            <p style="margin: 0; color: #333; font-style: italic;">"${message || 'No message content'}"</p>
          </div>
          
          <p>Our receptionist will review your inquiry and get back to you as soon as possible.</p>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Need immediate assistance?</strong></p>
            ${schoolPhone ? `<p style="margin: 5px 0 0 0; color: #666;">📞 Call us: ${schoolPhone}</p>` : ''}
            ${schoolEmail ? `<p style="margin: 5px 0 0 0; color: #666;">📧 Email: ${schoolEmail}</p>` : ''}
          </div>
          
          <p style="color: #666;">Best regards,<br><strong>${schoolName} Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">This is an automated response. Please do not reply directly to this email.</p>
        </div>
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
