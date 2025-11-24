import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weakSubjects, availableHours, assessments, learnerName } = await req.json();
    
    console.log('Generating study schedule for:', learnerName);
    console.log('Weak subjects:', weakSubjects);
    console.log('Available hours:', availableHours);
    console.log('Assessments:', assessments);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context about upcoming assessments
    const assessmentContext = assessments && assessments.length > 0
      ? `Upcoming assessments:\n${assessments.map((a: any) => 
          `- ${a.subject}: ${a.date} (${a.type})`
        ).join('\n')}`
      : 'No upcoming assessments scheduled.';

    // Build context about weak subjects
    const weakSubjectsContext = weakSubjects && weakSubjects.length > 0
      ? weakSubjects.map((s: any) => 
          `${s.area} (current score: ${s.average}%, trend: ${s.trend})`
        ).join(', ')
      : 'None specified';

    const systemPrompt = `You are an expert educational planner creating personalized study schedules for students. 
Create a detailed weekly study timetable that:
1. Prioritizes subjects with upcoming assessments
2. Allocates more time to struggling subjects (lower scores, declining trends)
3. Distributes study sessions across the week to avoid burnout
4. Includes varied study activities (review, practice, preparation)
5. Respects the student's available study hours
6. Includes short breaks between sessions
7. Suggests specific study strategies for each subject

Format the schedule as a structured weekly timetable with specific time slots, subjects, and activities.`;

    const userPrompt = `Create a personalized study schedule for ${learnerName}.

WEAK SUBJECTS (need more focus):
${weakSubjectsContext}

AVAILABLE STUDY TIME:
- Weekdays: ${availableHours?.weekdays || 2} hours per day
- Weekends: ${availableHours?.weekends || 4} hours per day
- Preferred session length: ${availableHours?.sessionLength || 45} minutes

${assessmentContext}

Generate a detailed weekly study schedule that:
- Allocates time proportionally based on subject difficulty and assessment urgency
- Includes specific study activities (e.g., "Review chapter 5", "Practice problems", "Create summary notes")
- Provides variety in study methods
- Includes 10-15 minute breaks between sessions
- Gives practical, actionable advice for each study block

Format as a clear day-by-day schedule with time slots, subjects, and activities.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const schedule = data.choices[0].message.content;

    console.log('Study schedule generated successfully');

    return new Response(
      JSON.stringify({ schedule }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-study-schedule:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
