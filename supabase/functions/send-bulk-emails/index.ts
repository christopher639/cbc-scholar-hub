import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRecipient {
  email: string;
  name: string;
  learnerName?: string;
  gradeName?: string;
  streamName?: string;
}

const generateEmailTemplate = (
  recipientName: string,
  subject: string,
  messageContent: string,
  schoolName: string,
  schoolLogo: string | null,
  isTeacher: boolean,
  learnerName?: string,
  gradeName?: string,
  streamName?: string
) => {
  const learnerInfo = !isTeacher && learnerName ? `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Student Information</p>
      <p style="margin: 8px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 500;">
        <strong>${learnerName}</strong>
        ${gradeName ? ` • ${gradeName}` : ''}${streamName ? ` • ${streamName}` : ''}
      </p>
    </div>
  ` : '';

  return `
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
                  <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">${schoolName}</h1>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  <!-- Greeting -->
                  <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 24px; font-weight: 600;">
                    Hello, ${recipientName}! 👋
                  </h2>
                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 15px;">
                    ${isTeacher ? 'We hope this message finds you well.' : 'We hope you and your family are doing well.'}
                  </p>
                  
                  ${learnerInfo}
                  
                  <!-- Subject Line -->
                  <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                      📌 ${subject}
                    </p>
                  </div>
                  
                  <!-- Message Content -->
                  <div style="color: #334155; font-size: 15px; line-height: 1.7;">
                    ${messageContent.split('\n').map(line => `<p style="margin: 0 0 12px 0;">${line}</p>`).join('')}
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-align: center;">
                    This is an official communication from ${schoolName}
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                    If you have any questions, please contact the school administration.
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Bottom spacing -->
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { messageId } = await req.json();

    console.log("Processing bulk message:", messageId);

    // Get the bulk message details
    const { data: message, error: messageError } = await supabase
      .from("bulk_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      throw new Error("Message not found");
    }

    // Get school info for logo and name
    const { data: schoolInfo } = await supabase
      .from("school_info")
      .select("school_name, logo_url, email")
      .maybeSingle();

    const schoolName = schoolInfo?.school_name || "School Administration";
    const schoolLogo = schoolInfo?.logo_url || null;

    console.log("Message details:", {
      recipient_type: message.recipient_type,
      message_type: message.message_type,
      grade_id: message.grade_id,
      stream_id: message.stream_id
    });

    let recipients: EmailRecipient[] = [];
    let sentCount = 0;
    let failedCount = 0;

    // Handle different recipient types
    if (message.recipient_type === "all_teachers") {
      // Get all teachers' details
      const { data: teachers, error: teachersError } = await supabase
        .from("teachers")
        .select("email, first_name, last_name");

      if (teachersError) {
        console.error("Error fetching teachers:", teachersError);
        throw teachersError;
      }

      recipients = teachers?.filter(t => t.email).map(t => ({
        email: t.email,
        name: `${t.first_name} ${t.last_name}`
      })) || [];
      
      console.log(`Found ${recipients.length} teachers to email`);

    } else {
      // Get parent recipients based on recipient_type (all, grade, stream)
      let recipientsQuery = supabase
        .from("learners")
        .select(`
          id,
          first_name,
          last_name,
          parent_id,
          current_grade_id,
          current_stream_id,
          parents!inner(email, first_name, last_name),
          grades:current_grade_id(name),
          streams:current_stream_id(name)
        `)
        .eq("status", "active");

      if (message.recipient_type === "grade" && message.grade_id) {
        recipientsQuery = recipientsQuery.eq("current_grade_id", message.grade_id);
      } else if (message.recipient_type === "stream" && message.stream_id) {
        recipientsQuery = recipientsQuery.eq("current_stream_id", message.stream_id);
      }

      const { data: learners, error: learnersError } = await recipientsQuery;

      if (learnersError) {
        console.error("Error fetching learners:", learnersError);
        throw learnersError;
      }

      console.log(`Found ${learners?.length || 0} learners with parents`);

      // Build recipients list with learner details
      const parentMap = new Map<string, EmailRecipient>();
      
      learners?.forEach((learner: any) => {
        if (learner.parents?.email) {
          const parentEmail = learner.parents.email;
          // If parent already exists, we could aggregate learner names, but for now use first learner
          if (!parentMap.has(parentEmail)) {
            parentMap.set(parentEmail, {
              email: parentEmail,
              name: `${learner.parents.first_name} ${learner.parents.last_name}`,
              learnerName: `${learner.first_name} ${learner.last_name}`,
              gradeName: learner.grades?.name || undefined,
              streamName: learner.streams?.name || undefined
            });
          }
        }
      });

      recipients = Array.from(parentMap.values());
      console.log(`Found ${recipients.length} unique parent emails`);
    }

    // Send emails only if message_type is email or both
    if (message.message_type === "email" || message.message_type === "both") {
      const isTeacher = message.recipient_type === "all_teachers";
      
      for (const recipient of recipients) {
        try {
          const emailHtml = generateEmailTemplate(
            recipient.name,
            message.subject || "School Communication",
            message.message,
            schoolName,
            schoolLogo,
            isTeacher,
            recipient.learnerName,
            recipient.gradeName,
            recipient.streamName
          );

          // Use verified domain email address
          const fromAddress = `${schoolName} <noreply@samge.sc.ke>`;

          await resend.emails.send({
            from: fromAddress,
            to: [recipient.email],
            subject: message.subject || "School Communication",
            html: emailHtml,
          });
          sentCount++;
          console.log(`Email sent to: ${recipient.email}`);
        } catch (error) {
          failedCount++;
          console.error(`Failed to send email to ${recipient.email}:`, error);
        }
      }
    } else {
      // For SMS only, just count as sent (actual SMS integration would go here)
      sentCount = recipients.length;
    }

    // Update the bulk_messages record
    await supabase
      .from("bulk_messages")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
      })
      .eq("id", messageId);

    console.log(`Bulk message processed. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        failedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
