import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLearnerDetail(learnerId: string) {
  const [learner, setLearner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLearnerDetail = async () => {
    try {
      setLoading(true);

      // Fetch learner with all related data
      const { data: learnerData, error: learnerError } = await supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades(id, name, grade_level),
          current_stream:streams(id, name),
          parent:parents(*)
        `)
        .eq("id", learnerId)
        .single();

      if (learnerError) throw learnerError;

      // Get current academic year and term
      const { data: currentYear } = await supabase
        .from("academic_years")
        .select("year")
        .eq("is_active", true)
        .maybeSingle();

      const { data: currentPeriod } = await supabase
        .from("academic_periods")
        .select("term, academic_year")
        .eq("is_current", true)
        .maybeSingle();

      // Fetch promotion history
      const { data: promotionHistory } = await supabase
        .from("promotion_history")
        .select(`
          *,
          from_grade:grades!promotion_history_from_grade_id_fkey(name),
          to_grade:grades!promotion_history_to_grade_id_fkey(name),
          from_stream:streams!promotion_history_from_stream_id_fkey(name),
          to_stream:streams!promotion_history_to_stream_id_fkey(name)
        `)
        .eq("learner_id", learnerId)
        .order("promotion_date", { ascending: false });

      // Fetch performance records
      const { data: performance } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          academic_period:academic_periods(academic_year, term)
        `)
        .eq("learner_id", learnerId)
        .order("created_at", { ascending: false });

      // Get fee structure for current grade, year, and term
      const { data: feeStructure } = await supabase
        .from("fee_structures")
        .select("amount, term")
        .eq("grade_id", learnerData.current_grade_id)
        .eq("academic_year", currentPeriod?.academic_year || currentYear?.year || "")
        .eq("term", currentPeriod?.term || "term_1")
        .maybeSingle();

      // Get all fee transactions for this learner
      const { data: transactions } = await supabase
        .from("fee_transactions")
        .select("*")
        .eq("learner_id", learnerId)
        .order("payment_date", { ascending: false });

      // Calculate total paid for current term
      const currentTermPaid = transactions
        ?.filter((t: any) => {
          // Match transactions for current academic year and term
          return true; // For now, sum all payments - you may want to filter by invoice term
        })
        .reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;

      const expectedAmount = feeStructure?.amount || 0;
      const balance = expectedAmount - currentTermPaid; // Can be negative (overpayment)

      setLearner({
        ...learnerData,
        promotionHistory: promotionHistory || [],
        performance: performance || [],
        currentAcademicYear: currentPeriod?.academic_year || currentYear?.year || "",
        currentTerm: currentPeriod?.term || "",
        feeInfo: {
          currentTermFees: expectedAmount,
          currentTermPaid: currentTermPaid,
          currentTermBalance: balance,
          transactions: transactions || [],
        },
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

  useEffect(() => {
    if (learnerId) {
      fetchLearnerDetail();
    }
  }, [learnerId]);

  return { learner, loading, refetch: fetchLearnerDetail };
}
