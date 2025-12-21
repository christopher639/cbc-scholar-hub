import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchGradesData = async () => {
  const { data: gradesData, error: gradesError } = await supabase
    .from("grades")
    .select("*, is_last_grade")
    .order("grade_level", { ascending: true });

  if (gradesError) throw gradesError;

  // For each grade, count learners and streams
  const gradesWithCounts = await Promise.all(
    (gradesData || []).map(async (grade) => {
      const { count: learnerCount } = await supabase
        .from("learners")
        .select("*", { count: "exact", head: true })
        .eq("current_grade_id", grade.id)
        .eq("status", "active");

      const { count: streamCount } = await supabase
        .from("streams")
        .select("*", { count: "exact", head: true })
        .eq("grade_id", grade.id);

      return {
        ...grade,
        learner_count: learnerCount || 0,
        stream_count: streamCount || 0,
      };
    })
  );

  return gradesWithCounts;
};

export function useGrades() {
  const queryClient = useQueryClient();

  const { data: grades = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGradesData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidateGrades = () => {
    queryClient.invalidateQueries({ queryKey: ['grades'] });
  };

  return { grades, loading, fetchGrades: refetch, invalidateGrades };
}
