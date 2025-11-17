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

      // Get fee structure for current grade
      const { data: feeStructure } = await supabase
        .from("fee_structures")
        .select("amount")
        .eq("grade_id", learnerData.current_grade_id)
        .maybeSingle();

      // Get all payments for this learner
      const { data: payments } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("learner_id", learnerId)
        .order("payment_date", { ascending: false });

      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const expectedAmount = feeStructure?.amount || 0;
      const balance = Math.max(0, expectedAmount - totalPaid);

      setLearner({
        ...learnerData,
        promotionHistory: promotionHistory || [],
        performance: performance || [],
        feeInfo: {
          totalFees: expectedAmount,
          paid: totalPaid,
          balance,
          payments: payments || [],
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
