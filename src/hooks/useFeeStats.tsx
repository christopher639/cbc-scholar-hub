import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFeeStats() {
  const [stats, setStats] = useState({
    totalCollected: 0,
    outstanding: 0,
    collectionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get total collected
      const { data: payments } = await supabase
        .from("fee_payments")
        .select("amount_paid");

      const totalCollected = payments?.reduce(
        (sum, payment) => sum + Number(payment.amount_paid),
        0
      ) || 0;

      // Get fee structures and calculate expected vs collected
      const { data: structures } = await supabase
        .from("fee_structures")
        .select("amount");

      const { data: learners } = await supabase
        .from("learners")
        .select("id");

      const totalExpected = (structures?.[0]?.amount || 0) * (learners?.length || 0);
      const outstanding = totalExpected - totalCollected;
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      setStats({
        totalCollected,
        outstanding: Math.max(0, outstanding),
        collectionRate,
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

  return { stats, loading, fetchStats };
}
