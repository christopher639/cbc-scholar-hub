import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportCardRequest {
  learnerId: string;
  academicYear: string;
  term: string;
  examType: string;
  recipientEmail?: string; // Optional: if not provided, use parent email
}

const getGradeCategory = (marks: number): string => {
  if (marks >= 80) return "E.E (Exceeding Expectation)";
  if (marks >= 50) return "M.E (Meeting Expectation)";
  if (marks >= 30) return "A.E (Approaching Expectation)";
  return "B.E (Below Expectation)";
};

const getGradeColor = (marks: number): string => {
  if (marks >= 80) return "#22c55e";
  if (marks >= 50) return "#3b82f6";
  if (marks >= 30) return "#f59e0b";
  return "#ef4444";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { learnerId, academicYear, term, examType, recipientEmail }: ReportCardRequest = await req.json();

    if (!learnerId || !academicYear || !term) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // Fetch school info
    const { data: schoolInfo } = await supabase
      .from("school_info")
      .select("school_name, logo_url, address, phone, email, motto")
      .single();

    const schoolName = schoolInfo?.school_name || "School";
    const schoolEmail = schoolInfo?.email || "noreply@school.com";
    const schoolLogo = schoolInfo?.logo_url || "";
    const schoolAddress = schoolInfo?.address || "";
    const schoolPhone = schoolInfo?.phone || "";
    const schoolMotto = schoolInfo?.motto || "";

    // Fetch learner details
    const { data: learner, error: learnerError } = await supabase
      .from("learners")
      .select(`
        id,
        first_name,
        last_name,
        admission_number,
        photo_url,
        current_grade_id,
        current_stream_id,
        parent:parents(email, first_name, last_name, phone),
        grade:grades(name),
        stream:streams(name)
      `)
      .eq("id", learnerId)
      .single();

    if (learnerError || !learner) {
      return new Response(
        JSON.stringify({ success: false, message: "Learner not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Determine recipient email
    const toEmail = recipientEmail || (learner.parent as any)?.email;
    if (!toEmail) {
      return new Response(
        JSON.stringify({ success: false, message: "No recipient email available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch performance records
    let query = supabase
      .from("performance_records")
      .select(`
        marks,
        grade_letter,
        exam_type,
        learning_area:learning_areas(name, code)
      `)
      .eq("learner_id", learnerId)
      .eq("academic_year", academicYear)
      .eq("term", term);

    if (examType && examType !== "combined") {
      query = query.eq("exam_type", examType);
    }

    const { data: performanceRecords, error: perfError } = await query;

    if (perfError) {
      console.error("Error fetching performance:", perfError);
      return new Response(
        JSON.stringify({ success: false, message: "Error fetching performance records" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Group by learning area
    const learningAreaScores = new Map<string, { opener?: number; mid_term?: number; final?: number; name: string }>();
    
    performanceRecords?.forEach((record: any) => {
      const areaName = record.learning_area?.name || "Unknown";
      if (!learningAreaScores.has(areaName)) {
        learningAreaScores.set(areaName, { name: areaName });
      }
      const current = learningAreaScores.get(areaName)!;
      if (record.exam_type === "opener") current.opener = record.marks;
      else if (record.exam_type === "mid_term") current.mid_term = record.marks;
      else if (record.exam_type === "final") current.final = record.marks;
    });

    // Calculate averages
    const subjects: Array<{ name: string; opener?: number; midTerm?: number; final?: number; average: number; grade: string }> = [];
    let totalAverage = 0;
    let subjectCount = 0;

    learningAreaScores.forEach((scores, name) => {
      const marks = [scores.opener, scores.mid_term, scores.final].filter(m => m !== undefined) as number[];
      if (marks.length > 0) {
        const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
        subjects.push({
          name,
          opener: scores.opener,
          midTerm: scores.mid_term,
          final: scores.final,
          average: Math.round(avg * 10) / 10,
          grade: getGradeCategory(avg).split(" ")[0]
        });
        totalAverage += avg;
        subjectCount++;
      }
    });

    const overallAverage = subjectCount > 0 ? Math.round((totalAverage / subjectCount) * 10) / 10 : 0;
    const overallGrade = getGradeCategory(overallAverage);

    // Format term for display
    const termDisplay = term.replace("term_", "Term ").replace("_", " ");
    const examTypeDisplay = examType === "combined" ? "All Exams" : examType?.replace("_", " ") || "";

    // Generate HTML email with embedded report card
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Report Card - ${learner.first_name} ${learner.last_name}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table role="presentation" style="width: 100%; max-width: 700px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; text-align: center;">
                  ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" style="max-height: 60px; max-width: 180px; margin-bottom: 8px;">` : `
                    <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 8px auto; display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-size: 24px; font-weight: bold;">${schoolName.charAt(0)}</span>
                    </div>
                  `}
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">${schoolName}</h1>
                  ${schoolMotto ? `<p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.9); font-size: 12px; font-style: italic;">${schoolMotto}</p>` : ""}
                  ${schoolAddress ? `<p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 11px;">${schoolAddress}</p>` : ""}
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td style="padding: 20px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <h2 style="margin: 0; color: #1e293b; font-size: 18px; text-align: center;">
                    📄 Academic Report Card
                  </h2>
                  <p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px; text-align: center;">
                    ${academicYear} | ${termDisplay} | ${examTypeDisplay}
                  </p>
                </td>
              </tr>

              <!-- Student Info -->
              <tr>
                <td style="padding: 20px 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="vertical-align: top; width: 70%;">
                        <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px;">
                          <strong>Student Name:</strong> ${learner.first_name} ${learner.last_name}
                        </p>
                        <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px;">
                          <strong>Admission No:</strong> ${learner.admission_number}
                        </p>
                        <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px;">
                          <strong>Class:</strong> ${(learner.grade as any)?.name || "N/A"} ${(learner.stream as any)?.name ? `- ${(learner.stream as any).name}` : ""}
                        </p>
                      </td>
                      ${learner.photo_url ? `
                      <td style="vertical-align: top; text-align: right; width: 30%;">
                        <img src="${learner.photo_url}" alt="Student Photo" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover; border: 2px solid #e2e8f0;">
                      </td>
                      ` : ""}
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Performance Table -->
              <tr>
                <td style="padding: 0 24px 20px 24px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background-color: #1e40af; color: white;">
                        <th style="padding: 10px 8px; text-align: left; border: 1px solid #1e3a8a;">Subject</th>
                        ${examType === "combined" || !examType ? `
                        <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a8a;">Opener</th>
                        <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a8a;">Mid-Term</th>
                        <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a8a;">Final</th>
                        ` : `
                        <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a8a;">Marks</th>
                        `}
                        <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a8a;">Avg</th>
                        <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a8a;">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${subjects.map((subject, index) => `
                      <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 500;">${subject.name}</td>
                        ${examType === "combined" || !examType ? `
                        <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">${subject.opener !== undefined ? subject.opener : "-"}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">${subject.midTerm !== undefined ? subject.midTerm : "-"}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">${subject.final !== undefined ? subject.final : "-"}</td>
                        ` : `
                        <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">${subject.opener || subject.midTerm || subject.final || "-"}</td>
                        `}
                        <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: ${getGradeColor(subject.average)};">${subject.average}</td>
                        <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: ${getGradeColor(subject.average)};">${subject.grade}</td>
                      </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Overall Summary -->
              <tr>
                <td style="padding: 0 24px 20px 24px;">
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 16px; border-left: 4px solid #3b82f6;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 50%; vertical-align: middle;">
                          <p style="margin: 0; color: #0369a1; font-size: 13px; font-weight: 600;">Overall Average</p>
                          <p style="margin: 4px 0 0 0; color: #1e3a8a; font-size: 24px; font-weight: 700;">${overallAverage}%</p>
                        </td>
                        <td style="width: 50%; vertical-align: middle; text-align: right;">
                          <p style="margin: 0; color: #0369a1; font-size: 13px; font-weight: 600;">Overall Grade</p>
                          <p style="margin: 4px 0 0 0; color: ${getGradeColor(overallAverage)}; font-size: 18px; font-weight: 700;">${overallGrade}</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Grading Key -->
              <tr>
                <td style="padding: 0 24px 20px 24px;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600;">GRADING KEY:</p>
                  <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.6;">
                    <span style="color: #22c55e;">●</span> E.E (80-100%): Exceeding Expectation |
                    <span style="color: #3b82f6;">●</span> M.E (50-79%): Meeting Expectation |
                    <span style="color: #f59e0b;">●</span> A.E (30-49%): Approaching Expectation |
                    <span style="color: #ef4444;">●</span> B.E (0-29%): Below Expectation
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 11px; text-align: center;">
                    This is an official academic report from ${schoolName}.
                    ${schoolPhone ? ` | 📞 ${schoolPhone}` : ""}${schoolEmail ? ` | ✉️ ${schoolEmail}` : ""}
                  </p>
                  <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 10px; text-align: center;">
                    Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    console.log("Sending report card email to:", toEmail);

    // Use verified domain email
    const fromAddress = `${schoolName} <noreply@samge.sc.ke>`;

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `📄 Report Card: ${learner.first_name} ${learner.last_name} - ${academicYear} ${termDisplay}`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Email sending failed:", emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, message: emailResponse.error.message || "Failed to send email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Report card email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Report card sent to ${toEmail}`,
        learnerName: `${learner.first_name} ${learner.last_name}`
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