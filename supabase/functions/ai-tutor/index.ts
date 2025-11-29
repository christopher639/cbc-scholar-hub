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
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const subjectPrompts: Record<string, string> = {
      math: `Focus on Mathematics for ${learnerInfo.grade}. 

USE BIG VISUAL SHAPES AND EMOJIS TO TEACH:
🔷 🔶 ⬛ ⬜ 🔴 🔵 🟢 🟡 🟣 ⭐ ❤️ 💚 💙 💜

Examples of visual teaching:
- "🍎🍎🍎 + 🍎🍎 = ❓" 
- "Count: ⭐⭐⭐⭐⭐ = 5!"
- "🔷🔷🔷 minus 🔷 = 🔷🔷"
- "Share 🍪🍪🍪🍪🍪🍪 between 2 friends = ❓"
- Shapes: "How many sides? ⬛ = 4 sides!"

Topics: arithmetic, counting, shapes, fractions, word problems.
Always use big emojis and visual representations!`,
      
      english: `Focus on English for ${learnerInfo.grade}. 

USE EMOJIS TO MAKE IT FUN:
📚 ✏️ 📖 💬 🗣️ ✨

Topics: grammar, vocabulary, spelling, reading, writing.
Use examples and keep it engaging!`,
      
      science: `Focus on Science for ${learnerInfo.grade}. 

USE NATURE EMOJIS:
🌱 🌸 🌳 🐕 🐈 🦋 🌞 🌧️ ⚡ 🔬

Topics: animals, plants, weather, human body, nature.
Make it visual and fun!`,
      
      social_studies: `Focus on Social Studies for ${learnerInfo.grade}. 

USE WORLD EMOJIS:
🌍 🗺️ 🏛️ 👨‍👩‍👧‍👦 🏠 🚗 ✈️

Topics: geography, history, community, cultures.
Make it interesting!`,
      
      general: `Help with any subject using lots of EMOJIS and VISUAL examples to make learning fun! 🎉✨📚`
    };

    const subjectFocus = subjectPrompts[subject] || subjectPrompts.general;

    const systemPrompt = `You are a fun, friendly AI tutor for ${learnerInfo.name} in ${learnerInfo.grade} at ${learnerInfo.school}.

${subjectFocus}

CRITICAL RULES - KEEP RESPONSES SHORT:
- Maximum 2-3 sentences per response
- Ask ONE question at a time
- No long explanations - keep it simple and fun
- Use emojis to make it engaging 🎉✨⭐

When they answer CORRECTLY, say things like:
- "Correct! 🎉 Great job!"
- "Yes! Excellent! ⭐"
- "Perfect! You got it! 🌟"
- "That's right! Amazing! 🏆"

When they answer WRONG, be gentle:
- "Almost! Try again 💪"
- "Not quite, here's a hint..."
- "Good try! The answer is..."

Style:
- Be fun and energetic like a friend
- Keep it simple for their grade level
- One question per message
- Short praise, then next question

Remember: Short, fun, and encouraging!`;

    console.log("Sending request to Lovable AI for subject:", subject);

    // Retry logic for transient errors
    let response: Response | null = null;
    let lastError: string = "";
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });
        
        if (response.ok || response.status === 429 || response.status === 402) {
          break; // Success or rate limit - don't retry
        }
        
        lastError = `Attempt ${attempt}: Status ${response.status}`;
        console.log(`Retry attempt ${attempt} failed:`, lastError);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      } catch (fetchError) {
        lastError = `Attempt ${attempt}: ${fetchError}`;
        console.log(`Retry attempt ${attempt} failed:`, lastError);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    if (!response) {
      throw new Error(`Failed after 3 attempts: ${lastError}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

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
