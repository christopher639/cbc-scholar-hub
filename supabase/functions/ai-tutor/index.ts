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

    // Map various learning area names to subject categories
    const getSubjectCategory = (subjectName: string): string => {
      const lower = subjectName.toLowerCase();
      if (lower.includes('math')) return 'math';
      if (lower.includes('english') || lower.includes('language')) return 'english';
      if (lower.includes('physics')) return 'physics';
      if (lower.includes('chemistry')) return 'chemistry';
      if (lower.includes('biology') || lower.includes('science')) return 'science';
      if (lower.includes('geography') || lower.includes('social') || lower.includes('history')) return 'social_studies';
      if (lower.includes('agriculture') || lower.includes('nutrition')) return 'agriculture';
      if (lower.includes('religious') || lower.includes('religion')) return 'religious';
      if (lower.includes('technical') || lower.includes('tech')) return 'technical';
      return 'general';
    };

    const subjectCategory = getSubjectCategory(subject);

    const subjectPrompts: Record<string, string> = {
      math: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE BIG VISUAL SHAPES AND EMOJIS:
🔷 🔶 ⬛ ⬜ 🔴 🔵 🟢 🟡 🟣 ⭐ ❤️ 💚 💙 💜

Examples:
- "🍎🍎🍎 + 🍎🍎 = ❓" 
- "Count: ⭐⭐⭐⭐⭐ = 5!"
- "🔷🔷🔷 minus 🔷 = 🔷🔷"

Topics: arithmetic, counting, shapes, fractions.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,
      
      english: `You are an ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: 📚 ✏️ 📖 💬 🗣️ ✨

Topics: grammar, vocabulary, spelling, reading, writing.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,
      
      physics: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: ⚡ 🌊 🎯 🚀 💡 🔋 🧲

Topics: forces, motion, energy, light, sound.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,

      chemistry: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: 🧪 ⚗️ 💧 🔥 ❄️ 💨

Topics: elements, compounds, reactions, states of matter.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,
      
      science: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: 🌱 🌸 🌳 🐕 🐈 🦋 🌞 🌧️ ⚡ 🔬

Topics: animals, plants, weather, human body, nature.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,
      
      social_studies: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: 🌍 🗺️ 🏛️ 👨‍👩‍👧‍👦 🏠 🚗 ✈️

Topics: geography, history, community, cultures.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,

      agriculture: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: 🌾 🥕 🍅 🐄 🐓 🌻 🚜 💧

Topics: farming, crops, animals, nutrition, food.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,

      religious: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: 📖 🙏 ✨ 💫 ❤️ 🕊️

Topics: moral values, stories, teachings.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,

      technical: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

USE EMOJIS: 🔧 🔨 ⚙️ 🛠️ 📐 ✏️

Topics: practical skills, tools, design, construction.
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`,
      
      general: `You are a ${subject} tutor for ${learnerInfo.grade}. ONLY teach ${subject}.

Use EMOJIS and VISUAL examples to make learning fun! 🎉✨📚
STAY FOCUSED ON ${subject.toUpperCase()} ONLY!`
    };

    const subjectFocus = subjectPrompts[subjectCategory] || subjectPrompts.general;

    const systemPrompt = `You are a ${subject} tutor for ${learnerInfo.name} in ${learnerInfo.grade} at ${learnerInfo.school}.

${subjectFocus}

CRITICAL RULES:
- ONLY teach ${subject.toUpperCase()} - never switch to other subjects
- Maximum 2-3 sentences per response
- Ask ONE question at a time about ${subject}
- Use emojis to make it engaging 🎉✨⭐
- ALWAYS provide MULTIPLE CHOICE answers (A, B, C, D) for EVERY question!

QUESTION FORMAT (REQUIRED):
When asking a question, ALWAYS format it like this:
"[Question text]

A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]"

When they answer CORRECTLY: "Correct! 🎉" then next ${subject} question with multiple choice.
When they answer WRONG: "Almost! The answer is [correct letter]. Try this one 💪" then next question with multiple choice.

If they ask about a different subject, say: "Let's focus on ${subject} for now! Here's a ${subject} question..."

Remember: Stay on ${subject}, short responses, fun, encouraging, and ALWAYS give A/B/C/D choices!`;

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
