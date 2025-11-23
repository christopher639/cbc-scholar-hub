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
        // Get all active learners with their grades
        const { data: activeLearnersData } = await supabase
          .from("learners")
          .select(`
            id,
            current_grade_id,
            grade:grades(id, name)
          `)
          .eq("status", "active");

        if (activeLearnersData && activeLearnersData.length > 0) {
          // Get fee structures for current period
          const { data: feeStructuresData } = await supabase
            .from("fee_structures")
            .select("id, grade_id, amount")
            .eq("academic_year", currentPeriodData.academic_year)
            .eq("term", currentPeriodData.term);

          // Create map of grade_id to fee structure
          const feeStructureMap = new Map();
          feeStructuresData?.forEach(fs => {
            feeStructureMap.set(fs.grade_id, fs);
          });

          // Get all payments for active learners
          const learnerIds = activeLearnersData.map(l => l.id);
          
          const { data: paymentsData } = await supabase
            .from("fee_transactions")
            .select("learner_id, amount_paid")
            .in("learner_id", learnerIds);

          const { data: feePaymentsData } = await supabase
            .from("fee_payments")
            .select("learner_id, amount_paid, fee_structure_id")
            .in("learner_id", learnerIds);

          // Create map of learner payments
          const paymentsByLearner = new Map();
          paymentsData?.forEach(p => {
            const current = paymentsByLearner.get(p.learner_id) || 0;
            paymentsByLearner.set(p.learner_id, current + Number(p.amount_paid));
          });
          
          feePaymentsData?.forEach(p => {
            const current = paymentsByLearner.get(p.learner_id) || 0;
            paymentsByLearner.set(p.learner_id, current + Number(p.amount_paid));
          });

          // Calculate by grade
          const gradeBalanceMap = new Map<string, { name: string; expected: number; paid: number }>();
          
          activeLearnersData.forEach((learner: any) => {
            const gradeId = learner.current_grade_id;
            const gradeName = learner.grade?.name || "Unknown";
            const feeStructure = feeStructureMap.get(gradeId);
            
            if (feeStructure) {
              const expectedAmount = Number(feeStructure.amount);
              const paidAmount = paymentsByLearner.get(learner.id) || 0;
              
              const existing = gradeBalanceMap.get(gradeId);
              if (existing) {
                existing.expected += expectedAmount;
                existing.paid += paidAmount;
              } else {
                gradeBalanceMap.set(gradeId, {
                  name: gradeName,
                  expected: expectedAmount,
                  paid: paidAmount
                });
              }
            }
          });

          // Calculate balances and total
          gradeBalanceMap.forEach((gradeData) => {
            const balance = gradeData.expected - gradeData.paid;
            uncollectedBalance += balance;
            balanceByGradeData.push({
              name: gradeData.name,
              balance: balance > 0 ? balance : 0
            });
          });

          // Sort by balance descending
          balanceByGradeData.sort((a, b) => b.balance - a.balance);
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
