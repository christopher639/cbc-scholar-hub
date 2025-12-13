import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PerformanceSmsRequest {
  academicYear: string;
  term: string;
  examType: string; // opener, mid_term, final, combined
  scope: "school" | "grade" | "stream";
  gradeId?: string;
  streamId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("TEXT_SMS_API_KEY")!;
    const partnerId = "15265";
    const shortcode = "TextSMS";

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { academicYear, term, examType, scope, gradeId, streamId }: PerformanceSmsRequest = await req.json();

    console.log("Performance SMS request:", { academicYear, term, examType, scope, gradeId, streamId });

    // Get school info
    const { data: schoolInfo } = await supabase
      .from("school_info")
      .select("school_name")
      .single();

    const schoolName = schoolInfo?.school_name || "School";

    // Get all learning areas for reference
    const { data: learningAreas } = await supabase
      .from("learning_areas")
      .select("id, name, code");

    const learningAreaMap = new Map(learningAreas?.map(la => [la.id, la]) || []);

    // Build learner query based on scope
    let learnersQuery = supabase
      .from("learners")
      .select(`
        id,
        first_name,
        last_name,
        admission_number,
        current_grade_id,
        current_stream_id,
        parent:parents(phone, first_name, last_name),
        grade:grades(name),
        stream:streams(name)
      `)
      .eq("status", "active");

    if (scope === "grade" && gradeId) {
      learnersQuery = learnersQuery.eq("current_grade_id", gradeId);
    } else if (scope === "stream" && streamId) {
      learnersQuery = learnersQuery.eq("current_stream_id", streamId);
    }

    const { data: learners, error: learnersError } = await learnersQuery;

    if (learnersError) {
      console.error("Error fetching learners:", learnersError);
      throw learnersError;
    }

    if (!learners || learners.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No learners found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch performance records for all learners
    let performanceQuery = supabase
      .from("performance_records")
      .select(`
        id,
        learner_id,
        marks,
        grade_letter,
        exam_type,
        learning_area_id
      `)
      .eq("academic_year", academicYear)
      .eq("term", term);

    if (examType !== "combined") {
      performanceQuery = performanceQuery.eq("exam_type", examType);
    }

    const { data: performanceRecords, error: perfError } = await performanceQuery;

    if (perfError) {
      console.error("Error fetching performance:", perfError);
      throw perfError;
    }

    // Group performance by learner and learning area
    const performanceByLearner = new Map<string, Map<string, any[]>>();
    
    performanceRecords?.forEach((record) => {
      if (!performanceByLearner.has(record.learner_id)) {
        performanceByLearner.set(record.learner_id, new Map());
      }
      const learnerPerf = performanceByLearner.get(record.learner_id)!;
      const laId = record.learning_area_id;
      
      if (!learnerPerf.has(laId)) {
        learnerPerf.set(laId, []);
      }
      learnerPerf.get(laId)!.push(record);
    });

    // Format phone number
    const formatPhone = (phone: string): string | null => {
      if (!phone) return null;
      let cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "254" + cleaned.substring(1);
      } else if (!cleaned.startsWith("254")) {
        cleaned = "254" + cleaned;
      }
      if (cleaned.length < 12) return null;
      return cleaned;
    };

    // Prepare SMS list
    const smsList: any[] = [];
    let clientSmsId = 1;

    for (const learner of learners) {
      const parent = learner.parent as any;
      if (!parent?.phone) continue;

      const formattedPhone = formatPhone(parent.phone);
      if (!formattedPhone) continue;

      const learnerPerfMap = performanceByLearner.get(learner.id);
      
      if (!learnerPerfMap || learnerPerfMap.size === 0) continue;

      // Build subject-wise performance summary
      const subjectSummary: { code: string; name: string; marks: number; examTypes: string[] }[] = [];
      
      learnerPerfMap.forEach((records, laId) => {
        const la = learningAreaMap.get(laId);
        if (!la) return;
        
        // Calculate average for combined or single exam type
        const totalMarks = records.reduce((sum, r) => sum + Number(r.marks), 0);
        const avgMarks = totalMarks / records.length;
        const examTypes = [...new Set(records.map(r => r.exam_type))];
        
        subjectSummary.push({
          code: la.code || la.name.substring(0, 4).toUpperCase(),
          name: la.name,
          marks: Math.round(avgMarks),
          examTypes
        });
      });

      if (subjectSummary.length === 0) continue;

      // Sort by marks descending
      subjectSummary.sort((a, b) => b.marks - a.marks);

      // Calculate overall average
      const totalAvg = subjectSummary.reduce((sum, s) => sum + s.marks, 0) / subjectSummary.length;

      // Get grade category
      let gradeCategory = "B.E";
      if (totalAvg >= 80) gradeCategory = "E.E";
      else if (totalAvg >= 50) gradeCategory = "M.E";
      else if (totalAvg >= 30) gradeCategory = "A.E";

      // Build detailed subject list (all subjects)
      const subjectList = subjectSummary.map(s => `${s.code}:${s.marks}`).join(", ");

      const termLabel = term.replace("_", " ").toUpperCase();
      const examLabel = examType === "combined" 
        ? "Combined (Opener+Mid+Final)" 
        : examType.replace("_", "-").toUpperCase();

      // Build comprehensive message with all subjects
      let message = `${schoolName}: Dear ${parent.first_name}, ${learner.first_name}'s ${termLabel} ${examLabel} Results:\n`;
      message += `Subjects: ${subjectList}\n`;
      message += `Overall Avg: ${totalAvg.toFixed(1)}% (${gradeCategory})\n`;
      message += `Total: ${subjectSummary.length} subjects`;

      smsList.push({
        partnerID: partnerId,
        apikey: apiKey,
        pass_type: "plain",
        clientsmsid: clientSmsId++,
        mobile: formattedPhone,
        message: message.substring(0, 480), // Allow 3 SMS parts for complete data
        shortcode: shortcode,
      });
    }

    if (smsList.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No parents with valid phone numbers or performance records found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending ${smsList.length} performance SMS messages`);

    // Send in batches of 20
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < smsList.length; i += 20) {
      const batch = smsList.slice(i, i + 20);
      
      const response = await fetch("https://sms.textsms.co.ke/api/services/sendbulk/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: batch.length,
          smslist: batch,
        }),
      });

      const result = await response.json();
      console.log(`Batch ${Math.floor(i / 20) + 1} response:`, result);

      for (const resp of result.responses || []) {
        if (resp["response-code"] === 200) {
          totalSent++;
        } else {
          totalFailed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Performance SMS sent: ${totalSent} successful, ${totalFailed} failed`,
        totalSent,
        totalFailed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-performance-sms:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
