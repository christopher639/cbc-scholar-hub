import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useStreamDetail(gradeId: string, streamId: string) {
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

          // Get fee structure for this grade
          const { data: structure } = await supabase
            .from("fee_structures")
            .select("amount")
            .eq("grade_id", stream.grade.id)
            .maybeSingle();

          const expectedAmount = structure?.amount || 0;
          totalExpected += expectedAmount;

          // Get total paid by this learner
          const { data: payments } = await supabase
            .from("fee_payments")
            .select("amount_paid")
            .eq("learner_id", learner.id);

          const paidAmount = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
          totalPaid += paidAmount;

          const feeBalance = Math.max(0, expectedAmount - paidAmount);

          return {
            ...learner,
            feeBalance,
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
  }, [gradeId, streamId]);

  return { streamData, learners, stats, loading, refetch: fetchStreamData };
}
