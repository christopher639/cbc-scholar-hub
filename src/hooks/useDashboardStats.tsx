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

      // Get fee collection with date filters - combine both fee_payments and fee_transactions
      let feePaymentsQuery = supabase
        .from("fee_payments")
        .select("amount_paid");

      if (startDate) {
        feePaymentsQuery = feePaymentsQuery.gte("payment_date", startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        feePaymentsQuery = feePaymentsQuery.lte("payment_date", endDate.toISOString().split('T')[0]);
      }

      const { data: feePaymentsData } = await feePaymentsQuery;

      let feeTransactionsQuery = supabase
        .from("fee_transactions")
        .select("amount_paid");

      if (startDate) {
        feeTransactionsQuery = feeTransactionsQuery.gte("payment_date", startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        feeTransactionsQuery = feeTransactionsQuery.lte("payment_date", endDate.toISOString().split('T')[0]);
      }

      const { data: feeTransactionsData } = await feeTransactionsQuery;

      // Combine both payment sources
      const totalFromPayments = feePaymentsData?.reduce(
        (sum, payment) => sum + Number(payment.amount_paid),
        0
      ) || 0;

      const totalFromTransactions = feeTransactionsData?.reduce(
        (sum, transaction) => sum + Number(transaction.amount_paid),
        0
      ) || 0;

      const totalCollection = totalFromPayments + totalFromTransactions;

      // ========== COMPREHENSIVE FEE BALANCE CALCULATION ==========
      // This calculates ALL outstanding fees from:
      // 1. Active learners - current and all previous terms
      // 2. Alumni - any unpaid fees before they graduated
      // Source: All student_invoices (total_amount - discount_amount) minus all payments

      // Get ALL invoices ever generated (for all learners including alumni)
      const { data: allInvoices } = await supabase
        .from("student_invoices")
        .select(`
          id,
          learner_id,
          grade_id,
          total_amount,
          discount_amount,
          status
        `)
        .neq("status", "cancelled");

      // Get ALL fee_transactions ever made
      const { data: allTransactions } = await supabase
        .from("fee_transactions")
        .select("learner_id, amount_paid");

      // Get ALL fee_payments ever made  
      const { data: allFeePayments } = await supabase
        .from("fee_payments")
        .select("learner_id, amount_paid");

      // Calculate total expected fees from all invoices
      const totalExpectedFees = allInvoices?.reduce((sum, inv) => {
        const invoiceAmount = Number(inv.total_amount) - Number(inv.discount_amount || 0);
        return sum + invoiceAmount;
      }, 0) || 0;

      // Calculate total payments received
      const totalPaidFromTransactions = allTransactions?.reduce(
        (sum, t) => sum + Number(t.amount_paid), 0
      ) || 0;

      const totalPaidFromPayments = allFeePayments?.reduce(
        (sum, p) => sum + Number(p.amount_paid), 0
      ) || 0;

      const totalPaid = totalPaidFromTransactions + totalPaidFromPayments;

      // Uncollected balance = Total expected - Total paid
      const uncollectedBalance = Math.max(0, totalExpectedFees - totalPaid);

      // ========== BALANCE BY GRADE CALCULATION ==========
      // Get all grades
      const { data: gradesData } = await supabase
        .from("grades")
        .select("id, name");

      // Create payment maps by learner
      const paymentsByLearner = new Map<string, number>();
      
      allTransactions?.forEach(t => {
        const current = paymentsByLearner.get(t.learner_id) || 0;
        paymentsByLearner.set(t.learner_id, current + Number(t.amount_paid));
      });
      
      allFeePayments?.forEach(p => {
        const current = paymentsByLearner.get(p.learner_id) || 0;
        paymentsByLearner.set(p.learner_id, current + Number(p.amount_paid));
      });

      // Calculate balance by grade from invoices
      const gradeBalanceMap = new Map<string, { name: string; expected: number; paid: number }>();

      // Initialize grades
      gradesData?.forEach(grade => {
        gradeBalanceMap.set(grade.id, { name: grade.name, expected: 0, paid: 0 });
      });

      // Aggregate invoice amounts by grade
      allInvoices?.forEach(inv => {
        const gradeId = inv.grade_id;
        const invoiceAmount = Number(inv.total_amount) - Number(inv.discount_amount || 0);
        
        const existing = gradeBalanceMap.get(gradeId);
        if (existing) {
          existing.expected += invoiceAmount;
        }
      });

      // Now we need to attribute payments to grades
      // Group invoices by learner to calculate what % of payments go to each grade
      const invoicesByLearner = new Map<string, Array<{ grade_id: string; amount: number }>>();
      
      allInvoices?.forEach(inv => {
        const learnerInvoices = invoicesByLearner.get(inv.learner_id) || [];
        learnerInvoices.push({
          grade_id: inv.grade_id,
          amount: Number(inv.total_amount) - Number(inv.discount_amount || 0)
        });
        invoicesByLearner.set(inv.learner_id, learnerInvoices);
      });

      // Distribute payments to grades proportionally based on invoices
      invoicesByLearner.forEach((invoices, learnerId) => {
        const totalLearnerPayments = paymentsByLearner.get(learnerId) || 0;
        const totalLearnerInvoices = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        
        if (totalLearnerInvoices > 0 && totalLearnerPayments > 0) {
          // Distribute payments proportionally across grades
          invoices.forEach(inv => {
            const proportion = inv.amount / totalLearnerInvoices;
            const attributedPayment = Math.min(totalLearnerPayments * proportion, inv.amount);
            
            const gradeData = gradeBalanceMap.get(inv.grade_id);
            if (gradeData) {
              gradeData.paid += attributedPayment;
            }
          });
        }
      });

      // Build balance by grade array
      const balanceByGradeData: any[] = [];
      gradeBalanceMap.forEach((gradeData) => {
        const balance = gradeData.expected - gradeData.paid;
        if (balance > 0) {
          balanceByGradeData.push({
            name: gradeData.name,
            balance: balance
          });
        }
      });

      // Sort by balance descending
      balanceByGradeData.sort((a, b) => b.balance - a.balance);

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

      // Get learner counts per grade for distribution
      const { data: learnerCounts } = await supabase
        .from("learners")
        .select("current_grade_id")
        .eq("status", "active");

      // Create a map of grade counts
      const countMap = new Map<string, number>();
      learnerCounts?.forEach(learner => {
        if (learner.current_grade_id) {
          countMap.set(
            learner.current_grade_id,
            (countMap.get(learner.current_grade_id) || 0) + 1
          );
        }
      });

      const distribution = (gradesData || []).map((grade: any) => {
        return {
          grade: grade.name,
          learners: countMap.get(grade.id) || 0,
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
        pendingAdmissions: 0,
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
