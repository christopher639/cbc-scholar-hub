import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, learnerInfo } = await req.json();
    
    const DEEP_SEEK_API_KEY = Deno.env.get("DEEP_SEEK_API_KEY");
    if (!DEEP_SEEK_API_KEY) {
      throw new Error("DEEP_SEEK_API_KEY is not configured");
    }

    const systemPrompt = `You are a friendly and encouraging AI tutor for a student named ${learnerInfo.name}. 
The student is currently in ${learnerInfo.grade} at ${learnerInfo.school}.

Your role is to:
1. Ask educational questions appropriate for their grade level
2. Help them understand concepts they're struggling with
3. Provide hints and explanations when they get stuck
4. Celebrate their correct answers and encourage them when they make mistakes
5. Cover subjects like Mathematics, English, Science, Social Studies, and other subjects appropriate for ${learnerInfo.grade}

Guidelines:
- Keep questions age-appropriate and aligned with their grade curriculum
- Use simple, clear language
- Be patient and supportive
- Provide step-by-step explanations when needed
- Mix different types of questions (multiple choice, short answer, problem-solving)
- Start by asking what subject they'd like to practice or what they need help with

Remember: You're here to help them learn and build confidence in their abilities!`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEP_SEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Tutor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
