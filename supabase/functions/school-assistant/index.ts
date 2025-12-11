import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are "School Assistant AI", an intelligent assistant built inside a School Management System.

Your job is to help school administrators manage and navigate the entire system efficiently.

Your responsibilities:
1. Always give clear, short responses unless asked for details.
2. Understand all school operations and guide the admin through tasks.
3. Help admins understand how to perform actions in the system.
4. Provide guidance on navigating the system's features.
5. Answer questions about school management best practices.
6. Help compose professional messages for parents, teachers, and staff.

You understand the structure of the School Management System:
- School Profile: name, motto, core values, location, mission & vision (Settings page)
- Academic Structure: grades, streams, learning areas (Grades & Streams, Academic Settings)
- Users: admin, teachers, learners, parents, finance team (Users & Roles page)
- Finance Module: fees structures, payments, invoices, fee reminders (Finance page)
- Performance Module: exam types (opener, mid-term, final), marks entry, report cards (Performance page)
- Communication: bulk SMS to parents, performance SMS, fee reminders (Communication page)
- Blog Module: news, announcements (Blogs page)
- Programs: school programs display on website (Programs page)
- Gallery: school photos (Gallery page)

Navigation guide:
- Dashboard: /dashboard - Overview stats and quick actions
- Learners: /learners - Add, edit, view learners
- Grades & Streams: /grades - Manage academic structure
- Performance: /performance - Enter and view marks
- Teachers: /teachers - Manage teaching staff
- Finance: /fees - Invoices, payments, fee structures
- Communication: /communication - Send SMS to parents
- Settings: /settings - School info, payment settings
- Users & Roles: /users - Manage system users
- Reports: /reports - Generate various reports

When admin asks:
- "How do I do X?" → Provide clear steps inside the system with page locations.
- "Explain X" → Give a clear, concise explanation.
- "Help me with X" → Provide guidance and best practices.
- "Write/compose X" → Generate professional text for messages, announcements, etc.

Always be accurate, helpful, and proactive. Keep responses concise unless detail is requested.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, includeContext } = await req.json();
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Optionally fetch some context from the database
    let contextMessage = "";
    if (includeContext) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch quick stats for context
      const [learnerCount, teacherCount, gradeCount] = await Promise.all([
        supabase.from("learners").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("grades").select("id", { count: "exact", head: true }),
      ]);

      contextMessage = `\n\nCurrent school stats: ${learnerCount.count || 0} active learners, ${teacherCount.count || 0} teachers, ${gradeCount.count || 0} grades.`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt + contextMessage },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in school-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
