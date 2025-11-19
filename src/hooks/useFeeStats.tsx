import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFeeStats(startDate?: Date, endDate?: Date) {
  const [stats, setStats] = useState({
    totalCollected: 0,
    outstanding: 0,
    collectionRate: 0,
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Build query with date filters
      let paymentsQuery = supabase
        .from("fee_payments")
        .select("amount_paid, payment_date");

      if (startDate) {
        paymentsQuery = paymentsQuery.gte("payment_date", startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        paymentsQuery = paymentsQuery.lte("payment_date", endDate.toISOString().split('T')[0]);
      }

      const { data: payments } = await paymentsQuery;

      const totalCollected = payments?.reduce(
        (sum, payment) => sum + Number(payment.amount_paid),
        0
      ) || 0;

      // Calculate trend data grouped by date
      const trendMap = new Map<string, number>();
      payments?.forEach(payment => {
        const date = payment.payment_date;
        trendMap.set(date, (trendMap.get(date) || 0) + Number(payment.amount_paid));
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

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
      setTrendData(trend);
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

  return { stats, trendData, loading, fetchStats };
}
