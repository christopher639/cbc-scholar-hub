import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLearnerJourney() {
  const [journeyData, setJourneyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLearnerJourney = async (learnerId: string) => {
    try {
      setLoading(true);

      // Fetch learner details
      const { data: learner, error: learnerError } = await supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades!learners_current_grade_id_fkey(id, name),
          current_stream:streams!learners_current_stream_id_fkey(id, name),
          parent:parents(first_name, last_name, phone, email)
        `)
        .eq("id", learnerId)
        .single();

      if (learnerError) throw learnerError;

      // Fetch promotion history
      const { data: promotions, error: promotionsError } = await supabase
        .from("promotion_history")
        .select(`
          *,
          from_grade:grades!promotion_history_from_grade_id_fkey(name),
          from_stream:streams!promotion_history_from_stream_id_fkey(name),
          to_grade:grades!promotion_history_to_grade_id_fkey(name),
          to_stream:streams!promotion_history_to_stream_id_fkey(name)
        `)
        .eq("learner_id", learnerId)
        .order("promotion_date", { ascending: false });

      if (promotionsError) throw promotionsError;

      // Fetch all performance records grouped by academic period
      const { data: performance, error: performanceError } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          grade:grades(name),
          stream:streams(name)
        `)
        .eq("learner_id", learnerId)
        .order("academic_year", { ascending: false })
        .order("term", { ascending: false });

      if (performanceError) throw performanceError;

      // Group performance by academic year and term
      const performanceByPeriod = performance?.reduce((acc: any, record: any) => {
        const key = `${record.academic_year}-${record.term}`;
        if (!acc[key]) {
          acc[key] = {
            academic_year: record.academic_year,
            term: record.term,
            grade: record.grade?.name,
            stream: record.stream?.name,
            records: [],
            total_marks: 0,
            subjects_count: 0,
          };
        }
        acc[key].records.push(record);
        acc[key].total_marks += Number(record.marks);
        acc[key].subjects_count += 1;
        return acc;
      }, {});

      // Calculate averages
      const performanceSummary = Object.values(performanceByPeriod || {}).map((period: any) => ({
        ...period,
        average_marks: period.total_marks / period.subjects_count,
      }));

      // Fetch transfer records if any
      const { data: transfers, error: transfersError } = await supabase
        .from("transfer_records")
        .select("*")
        .eq("learner_id", learnerId);

      if (transfersError) throw transfersError;

      // Fetch alumni status if applicable
      const { data: alumni, error: alumniError } = await supabase
        .from("alumni")
        .select(`
          *,
          final_grade:grades!alumni_final_grade_id_fkey(name),
          final_stream:streams!alumni_final_stream_id_fkey(name)
        `)
        .eq("learner_id", learnerId)
        .maybeSingle();

      if (alumniError) throw alumniError;

      setJourneyData({
        learner,
        promotions: promotions || [],
        performance: performanceSummary,
        transfers: transfers || [],
        alumni,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { journeyData, loading, fetchLearnerJourney };
}
