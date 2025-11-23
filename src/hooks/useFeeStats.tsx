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

      // Build query with date filters - Get fee_payments
      let feePaymentsQuery = supabase
        .from("fee_payments")
        .select("amount_paid, payment_date");

      if (startDate) {
        feePaymentsQuery = feePaymentsQuery.gte("payment_date", startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        feePaymentsQuery = feePaymentsQuery.lte("payment_date", endDate.toISOString().split('T')[0]);
      }

      const { data: feePayments } = await feePaymentsQuery;

      // Get fee_transactions
      let feeTransactionsQuery = supabase
        .from("fee_transactions")
        .select("amount_paid, payment_date");

      if (startDate) {
        feeTransactionsQuery = feeTransactionsQuery.gte("payment_date", startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        feeTransactionsQuery = feeTransactionsQuery.lte("payment_date", endDate.toISOString().split('T')[0]);
      }

      const { data: feeTransactions } = await feeTransactionsQuery;

      // Combine both payment sources
      const totalFromPayments = feePayments?.reduce(
        (sum, payment) => sum + Number(payment.amount_paid),
        0
      ) || 0;

      const totalFromTransactions = feeTransactions?.reduce(
        (sum, transaction) => sum + Number(transaction.amount_paid),
        0
      ) || 0;

      const totalCollected = totalFromPayments + totalFromTransactions;

      // Calculate trend data grouped by date - combine both sources
      const trendMap = new Map<string, number>();
      feePayments?.forEach(payment => {
        const date = payment.payment_date;
        trendMap.set(date, (trendMap.get(date) || 0) + Number(payment.amount_paid));
      });
      feeTransactions?.forEach(transaction => {
        const date = transaction.payment_date;
        trendMap.set(date, (trendMap.get(date) || 0) + Number(transaction.amount_paid));
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Get current academic period for accurate calculation
      const { data: currentPeriodData } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("is_current", true)
        .maybeSingle();

      let totalExpected = 0;
      
      if (currentPeriodData) {
        // Get all active learners with their grades
        const { data: activeLearnersData } = await supabase
          .from("learners")
          .select("id, current_grade_id")
          .eq("status", "active");

        if (activeLearnersData && activeLearnersData.length > 0) {
          // Get fee structures for current period
          const { data: feeStructuresData } = await supabase
            .from("fee_structures")
            .select("grade_id, amount")
            .eq("academic_year", currentPeriodData.academic_year)
            .eq("term", currentPeriodData.term);

          // Create map of grade_id to fee amount
          const feeStructureMap = new Map();
          feeStructuresData?.forEach(fs => {
            feeStructureMap.set(fs.grade_id, Number(fs.amount));
          });

          // Calculate expected fees based on each learner's grade
          activeLearnersData.forEach((learner: any) => {
            const expectedAmount = feeStructureMap.get(learner.current_grade_id) || 0;
            totalExpected += expectedAmount;
          });
        }
      }

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
