import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDashboardStats(startDate?: Date, endDate?: Date) {
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalAlumni: 0,
    activeStreams: 0,
    feeCollection: 0,
    pendingAdmissions: 0,
    uncollectedBalance: 0,
  });
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [balanceByGrade, setBalanceByGrade] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get total active learners
      const { count: learnersCount } = await supabase
        .from("learners")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get total alumni
      const { count: alumniCount } = await supabase
        .from("alumni")
        .select("*", { count: "exact", head: true });

      // Get active streams
      const { count: streamsCount } = await supabase
        .from("streams")
        .select("*", { count: "exact", head: true });

      // Get fee collection with date filters
      let paymentsQuery = supabase
        .from("fee_payments")
        .select("amount_paid");

      if (startDate) {
        paymentsQuery = paymentsQuery.gte("payment_date", startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        paymentsQuery = paymentsQuery.lte("payment_date", endDate.toISOString().split('T')[0]);
      }

      const { data: paymentsData } = await paymentsQuery;

      const totalCollection = paymentsData?.reduce(
        (sum, payment) => sum + Number(payment.amount_paid),
        0
      ) || 0;

      // Get current academic period
      const { data: currentPeriodData } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("is_current", true)
        .maybeSingle();

      // Calculate uncollected balance based on current period
      let uncollectedBalance = 0;
      const balanceByGradeData: any[] = [];
      
      if (currentPeriodData) {
        // Get all active learners
        const { data: activeLearnersData } = await supabase
          .from("learners")
          .select("id")
          .eq("status", "active");

        const activeLearnerIds = activeLearnersData?.map(l => l.id) || [];

        if (activeLearnerIds.length > 0) {
          // Get all invoices for active learners in current period with grade info
          const { data: invoicesData } = await supabase
            .from("student_invoices")
            .select(`
              balance_due,
              grade:grades(id, name)
            `)
            .eq("academic_year", currentPeriodData.academic_year)
            .eq("term", currentPeriodData.term)
            .neq("status", "cancelled")
            .in("learner_id", activeLearnerIds);

          uncollectedBalance = invoicesData?.reduce(
            (sum, invoice) => sum + Number(invoice.balance_due),
            0
          ) || 0;

          // Group balance by grade
          const gradeBalanceMap = new Map<string, { name: string; balance: number }>();
          
          invoicesData?.forEach((invoice: any) => {
            const gradeId = invoice.grade?.id;
            const gradeName = invoice.grade?.name || "Unknown";
            const balance = Number(invoice.balance_due);
            
            if (gradeId) {
              const existing = gradeBalanceMap.get(gradeId);
              if (existing) {
                existing.balance += balance;
              } else {
                gradeBalanceMap.set(gradeId, { name: gradeName, balance });
              }
            }
          });

          // Convert to array and sort by balance
          balanceByGradeData.push(
            ...Array.from(gradeBalanceMap.values())
              .sort((a, b) => b.balance - a.balance)
          );
        }
      }

      // Get recent admissions
      const { data: admissionsData } = await supabase
        .from("learners")
        .select(`
          admission_number,
          first_name,
          last_name,
          enrollment_date,
          current_grade:grades(name),
          current_stream:streams(name)
        `)
        .order("enrollment_date", { ascending: false })
        .limit(5);

      // Get grade distribution with actual learner counts
      const { data: gradesData } = await supabase
        .from("grades")
        .select(`
          id,
          name,
          learners:learners(count)
        `);

      const distribution = (gradesData || []).map((grade: any) => {
        const learnerCount = grade.learners?.[0]?.count || 0;
        return {
          grade: grade.name,
          learners: learnerCount,
        };
      }).filter(g => g.learners > 0);

      // Get recent payments
      const { data: paymentsHistoryData } = await supabase
        .from("fee_transactions")
        .select(`
          id,
          transaction_number,
          amount_paid,
          payment_date,
          payment_method,
          learner:learners(
            admission_number,
            first_name,
            last_name
          )
        `)
        .order("payment_date", { ascending: false })
        .limit(5);

      setStats({
        totalLearners: learnersCount || 0,
        totalAlumni: alumniCount || 0,
        activeStreams: streamsCount || 0,
        feeCollection: totalCollection,
        pendingAdmissions: 0, // Can be calculated based on status field if added
        uncollectedBalance,
      });

      setRecentAdmissions(admissionsData || []);
      setGradeDistribution(distribution);
      setRecentPayments(paymentsHistoryData || []);
      setBalanceByGrade(balanceByGradeData);
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

  return { stats, recentAdmissions, gradeDistribution, recentPayments, balanceByGrade, loading, fetchStats };
}
