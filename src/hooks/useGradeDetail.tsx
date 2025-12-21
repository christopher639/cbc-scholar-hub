import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

const fetchGradeDetailData = async (gradeId: string, academicYear?: string, term?: Term) => {
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
  let learnersWithFees: any[] = [];
  
  if (academicYear && term) {
    learnersWithFees = await Promise.all(
      (learnersData || []).map(async (learner) => {
        const { data: structure } = await supabase
          .from("fee_structures")
          .select("id, amount")
          .eq("grade_id", learner.current_grade_id)
          .eq("academic_year", academicYear)
          .eq("term", term)
          .maybeSingle();

        const totalFees = structure?.amount || 0;

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
          balance: feeBalance, // Alias for compatibility
          status: feeBalance === 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
        };
      })
    );
  } else {
    // Return learners with default fee values when no academic filters
    learnersWithFees = (learnersData || []).map(learner => ({
      ...learner,
      totalFees: 0,
      amountPaid: 0,
      feeBalance: 0,
      balance: 0,
      status: "pending",
    }));
  }

  return {
    gradeData: grade,
    streams: streamsData || [],
    learners: learnersWithFees,
  };
};

export function useGradeDetail(gradeId: string, academicYear?: string, term?: Term) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['gradeDetail', gradeId, academicYear, term],
    queryFn: () => fetchGradeDetailData(gradeId, academicYear, term),
    enabled: !!gradeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    gradeData: data?.gradeData || null,
    streams: data?.streams || [],
    learners: (data?.learners || []) as any[],
    loading,
    refetch,
  };
}

export async function prefetchGradeDetail(gradeId: string, queryClient: any, academicYear?: string, term?: Term) {
  return queryClient.prefetchQuery({
    queryKey: ['gradeDetail', gradeId, academicYear, term],
    queryFn: () => fetchGradeDetailData(gradeId, academicYear, term),
    staleTime: 5 * 60 * 1000,
  });
}
