import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

const fetchStreamDetailData = async (gradeId: string, streamId: string, academicYear?: string, term?: Term) => {
  // Fetch stream info
  const { data: stream, error: streamError } = await supabase
    .from("streams")
    .select("*, grade:grades(id, name)")
    .eq("id", streamId)
    .single();

  if (streamError) throw streamError;

  // Fetch learners for this stream
  const { data: learnersData, error: learnersError } = await supabase
    .from("learners")
    .select("*")
    .eq("current_stream_id", streamId)
    .order("first_name", { ascending: true });

  if (learnersError) throw learnersError;

  // Calculate statistics and fee balances
  let totalMale = 0;
  let totalFemale = 0;
  let totalExpected = 0;
  let totalPaid = 0;

  const learnersWithFees = await Promise.all(
    (learnersData || []).map(async (learner) => {
      if (learner.gender === "male") totalMale++;
      if (learner.gender === "female") totalFemale++;

      let expectedAmount = 0;
      let paidAmount = 0;
      let feeBalance = 0;
      let status = "pending";

      if (academicYear && term) {
        const { data: structure } = await supabase
          .from("fee_structures")
          .select("id, amount")
          .eq("grade_id", stream.grade.id)
          .eq("academic_year", academicYear)
          .eq("term", term)
          .maybeSingle();

        expectedAmount = structure?.amount || 0;
        totalExpected += expectedAmount;

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
          .eq("fee_structures.grade_id", stream.grade.id)
          .eq("fee_structures.academic_year", academicYear)
          .eq("fee_structures.term", term);

        paidAmount = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
        totalPaid += paidAmount;
        feeBalance = Math.max(0, expectedAmount - paidAmount);
        status = feeBalance === 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";
      }

      return {
        ...learner,
        totalFees: expectedAmount,
        amountPaid: paidAmount,
        feeBalance,
        balance: feeBalance, // Alias for compatibility
        status,
      };
    })
  );

  const feeCollectionRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

  return {
    streamData: stream,
    learners: learnersWithFees,
    stats: {
      total: learnersData?.length || 0,
      male: totalMale,
      female: totalFemale,
      capacity: stream.capacity || 0,
      feeCollectionRate,
    },
  };
};

export function useStreamDetail(gradeId: string, streamId: string, academicYear?: string, term?: Term) {
  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['streamDetail', gradeId, streamId, academicYear, term],
    queryFn: () => fetchStreamDetailData(gradeId, streamId, academicYear, term),
    enabled: !!(gradeId && streamId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    streamData: data?.streamData || null,
    learners: (data?.learners || []) as any[],
    stats: data?.stats || { total: 0, male: 0, female: 0, capacity: 0, feeCollectionRate: 0 },
    loading,
    refetch,
  };
}

export async function prefetchStreamDetail(gradeId: string, streamId: string, queryClient: any, academicYear?: string, term?: Term) {
  return queryClient.prefetchQuery({
    queryKey: ['streamDetail', gradeId, streamId, academicYear, term],
    queryFn: () => fetchStreamDetailData(gradeId, streamId, academicYear, term),
    staleTime: 5 * 60 * 1000,
  });
}
