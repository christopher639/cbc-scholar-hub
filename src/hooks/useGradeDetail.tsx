import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGradeDetail(gradeId: string) {
  const [gradeData, setGradeData] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGradeData = async () => {
    try {
      setLoading(true);

      // Fetch grade info
      const { data: grade, error: gradeError } = await supabase
        .from("grades")
        .select("*")
        .eq("id", gradeId)
        .single();

      if (gradeError) throw gradeError;

      // Fetch streams for this grade
      const { data: streamsData, error: streamsError } = await supabase
        .from("streams")
        .select("*, learners(count)")
        .eq("grade_id", gradeId)
        .order("name", { ascending: true });

      if (streamsError) throw streamsError;

      // Fetch learners for this grade
      const { data: learnersData, error: learnersError } = await supabase
        .from("learners")
        .select(`
          *,
          current_stream:streams(name)
        `)
        .eq("current_grade_id", gradeId)
        .order("first_name", { ascending: true });

      if (learnersError) throw learnersError;

      // Calculate fee balances for learners
      const learnersWithFees = await Promise.all(
        (learnersData || []).map(async (learner) => {
          // Get total paid
          const { data: payments } = await supabase
            .from("fee_payments")
            .select("amount_paid")
            .eq("learner_id", learner.id);

          const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;

          // Get expected fee
          const { data: structure } = await supabase
            .from("fee_structures")
            .select("amount")
            .eq("grade_id", gradeId)
            .maybeSingle();

          const expectedAmount = structure?.amount || 0;
          const feeBalance = Math.max(0, expectedAmount - totalPaid);

          return {
            ...learner,
            feeBalance,
          };
        })
      );

      setGradeData(grade);
      setStreams(streamsData || []);
      setLearners(learnersWithFees);
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
    if (gradeId) {
      fetchGradeData();
    }
  }, [gradeId]);

  return { gradeData, streams, learners, loading, refetch: fetchGradeData };
}
