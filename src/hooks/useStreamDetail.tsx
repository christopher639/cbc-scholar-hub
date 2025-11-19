import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

export function useStreamDetail(gradeId: string, streamId: string, academicYear?: string, term?: Term) {
  const [streamData, setStreamData] = useState<any>(null);
  const [learners, setLearners] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    capacity: 0,
    feeCollectionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStreamData = async () => {
    try {
      setLoading(true);

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
          // Count by gender
          if (learner.gender === "male") totalMale++;
          if (learner.gender === "female") totalFemale++;

          // Only calculate fees if academic year and term are provided
          let expectedAmount = 0;
          let paidAmount = 0;
          let feeBalance = 0;
          let status = "pending";

          if (academicYear && term) {
            // Get fee structure for specific grade/term/year
            const { data: structure } = await supabase
              .from("fee_structures")
              .select("id, amount")
              .eq("grade_id", stream.grade.id)
              .eq("academic_year", academicYear)
              .eq("term", term)
              .maybeSingle();

            expectedAmount = structure?.amount || 0;
            totalExpected += expectedAmount;

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
            status,
          };
        })
      );

      const feeCollectionRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

      setStreamData(stream);
      setLearners(learnersWithFees);
      setStats({
        total: learnersData?.length || 0,
        male: totalMale,
        female: totalFemale,
        capacity: stream.capacity || 0,
        feeCollectionRate,
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
    if (gradeId && streamId) {
      fetchStreamData();
    }
  }, [gradeId, streamId, academicYear, term]);

  return { streamData, learners, stats, loading, refetch: fetchStreamData };
}
