import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

export function useGradeDetail(gradeId: string, academicYear?: string, term?: Term) {
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

      // Calculate fee balances for learners (only if academic year and term provided)
      let learnersWithFees = learnersData || [];
      
      if (academicYear && term) {
        learnersWithFees = await Promise.all(
          (learnersData || []).map(async (learner) => {
            // Get fee structure for specific grade/term/year
            const { data: structure } = await supabase
              .from("fee_structures")
              .select("id, amount")
              .eq("grade_id", learner.current_grade_id)
              .eq("academic_year", academicYear)
              .eq("term", term)
              .maybeSingle();

            const totalFees = structure?.amount || 0;

            // Get payments for this specific grade/term/year
            const { data: payments } = await supabase
              .from("fee_payments")
              .select(`
                amount_paid,
                fee_structures!inner(
                  grade_id,
                  academic_year,
                  term
                )
              `)
              .eq("learner_id", learner.id)
              .eq("fee_structures.grade_id", learner.current_grade_id)
              .eq("fee_structures.academic_year", academicYear)
              .eq("fee_structures.term", term);

            const amountPaid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
            const feeBalance = Math.max(0, totalFees - amountPaid);

            return {
              ...learner,
              totalFees,
              amountPaid,
              feeBalance,
              status: feeBalance === 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
            };
          })
        );
      }

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
  }, [gradeId, academicYear, term]);

  return { gradeData, streams, learners, loading, refetch: fetchGradeData };
}
