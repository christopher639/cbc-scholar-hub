import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGrades() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGrades = async () => {
    try {
      setLoading(true);
      
      // Fetch grades with streams
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .order("grade_level", { ascending: true });

      if (gradesError) throw gradesError;

      // For each grade, count learners and streams
      const gradesWithCounts = await Promise.all(
        (gradesData || []).map(async (grade) => {
          const { count: learnerCount } = await supabase
            .from("learners")
            .select("*", { count: "exact", head: true })
            .eq("current_grade_id", grade.id);

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

      setGrades(gradesWithCounts);
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

  useEffect(() => {
    fetchGrades();
  }, []);

  return { grades, loading, fetchGrades };
}
