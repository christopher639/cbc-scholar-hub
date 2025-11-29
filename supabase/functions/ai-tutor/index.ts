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
    const { messages, learnerInfo, subject } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const subjectPrompts: Record<string, string> = {
      math: `Focus on Mathematics topics appropriate for ${learnerInfo.grade}. Cover topics like:
- Basic arithmetic and number operations
- Fractions, decimals, and percentages
- Geometry and shapes
- Word problems and problem-solving
- Algebra basics (for higher grades)
Ask practice questions, provide step-by-step solutions, and give hints when needed.`,
      
      english: `Focus on English Language topics appropriate for ${learnerInfo.grade}. Cover topics like:
- Grammar and sentence structure
- Vocabulary and spelling
- Reading comprehension
- Creative writing prompts
- Parts of speech
Ask questions, provide examples, and help improve their language skills.`,
      
      science: `Focus on Science topics appropriate for ${learnerInfo.grade}. Cover topics like:
- Living things and their habitats
- Human body and health
- Plants and animals
- Weather and climate
- Basic physics concepts (force, energy, light)
- Simple chemistry (states of matter)
Ask questions, explain concepts clearly, and relate to real-world examples.`,
      
      social_studies: `Focus on Social Studies topics appropriate for ${learnerInfo.grade}. Cover topics like:
- Geography and maps
- History and important events
- Community helpers and occupations
- Civics and citizenship
- Culture and traditions
- Environment and conservation
Ask questions, discuss concepts, and encourage critical thinking.`,
      
      general: `Cover any subject the student wants to practice. Be flexible and adapt to their needs. You can help with Mathematics, English, Science, Social Studies, or any other topic they're studying.`
    };

    const subjectFocus = subjectPrompts[subject] || subjectPrompts.general;

    const systemPrompt = `You are a friendly and encouraging AI tutor for a student named ${learnerInfo.name}. 
The student is currently in ${learnerInfo.grade} at ${learnerInfo.school}.

${subjectFocus}

Your role is to:
1. Ask educational questions appropriate for their grade level
2. Help them understand concepts they're struggling with
3. Provide hints and explanations when they get stuck
4. Celebrate their correct answers and encourage them when they make mistakes
5. Keep the learning fun and engaging

Guidelines:
- Keep questions age-appropriate and aligned with their grade curriculum
- Use simple, clear language
- Be patient and supportive
- Provide step-by-step explanations when needed
- Mix different types of questions (multiple choice, short answer, problem-solving)
- Use emojis occasionally to keep it fun 🎉📚✨
- If starting a new session, introduce yourself and ask what specific topic they'd like to practice

Remember: You're here to help them learn and build confidence in their abilities!`;

    console.log("Sending request to Gemini AI for subject:", subject);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\n" + (messages.length > 0 ? messages.map((m: any) => `${m.role}: ${m.content}`).join("\n") : "Please start the session by introducing yourself and asking what topic the student wants to practice.") }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    console.log("AI response received successfully");

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
