import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

interface FeeBalanceParams {
  gradeId?: string;
  streamId?: string;
  academicYear: string;
  term: Term;
}

const fetchFeeBalancesData = async ({ gradeId, streamId, academicYear, term }: FeeBalanceParams) => {
  let learnerQuery = supabase
    .from("learners")
    .select(`
      id,
      admission_number,
      first_name,
      last_name,
      current_grade_id,
      current_stream_id,
      current_grade:grades(name),
      current_stream:streams(name)
    `);

  if (gradeId) {
    learnerQuery = learnerQuery.eq("current_grade_id", gradeId);
  }
  if (streamId) {
    learnerQuery = learnerQuery.eq("current_stream_id", streamId);
  }

  const { data: learners, error: learnersError } = await learnerQuery;
  if (learnersError) throw learnersError;

  const balancesData = await Promise.all(
    (learners || []).map(async (learner) => {
      // First check if there's an invoice for this term/year
      const { data: invoice } = await supabase
        .from("student_invoices")
        .select("id, total_amount, discount_amount, balance_due, amount_paid")
        .eq("learner_id", learner.id)
        .eq("grade_id", learner.current_grade_id)
        .eq("academic_year", academicYear)
        .eq("term", term)
        .neq("status", "cancelled")
        .maybeSingle();

      // If invoice exists, use its data (includes discount)
      if (invoice) {
        const totalFees = Number(invoice.total_amount) || 0;
        const discountAmount = Number(invoice.discount_amount) || 0;
        const amountPaid = Number(invoice.amount_paid) || 0;
        const balance = Number(invoice.balance_due) || 0;

        return {
          ...learner,
          totalFees,
          discountAmount,
          amountPaid,
          balance,
          status: balance <= 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
        };
      }

      // Fallback to fee structure if no invoice
      const { data: structure } = await supabase
        .from("fee_structures")
        .select("id, amount")
        .eq("grade_id", learner.current_grade_id)
        .eq("academic_year", academicYear)
        .eq("term", term)
        .maybeSingle();

      const totalFees = structure?.amount || 0;

      const { data: feePayments } = await supabase
        .from("fee_payments")
        .select(`amount_paid, fee_structures!inner(grade_id, academic_year, term)`)
        .eq("learner_id", learner.id)
        .eq("fee_structures.grade_id", learner.current_grade_id)
        .eq("fee_structures.academic_year", academicYear)
        .eq("fee_structures.term", term);

      const amountPaid = feePayments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const balance = Math.max(0, totalFees - amountPaid);

      return {
        ...learner,
        totalFees,
        discountAmount: 0,
        amountPaid,
        balance,
        status: balance === 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
      };
    })
  );

  return balancesData;
};

export function useFeeBalances(params: FeeBalanceParams) {
  const { data: balances = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['feeBalances', params.gradeId, params.streamId, params.academicYear, params.term],
    queryFn: () => fetchFeeBalancesData(params),
    enabled: !!(params.academicYear && params.term),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return { balances, loading, refetch };
}
