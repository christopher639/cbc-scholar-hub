import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalLearners: number;
  totalAlumni: number;
  activeStreams: number;
  feeCollection: number;
  pendingAdmissions: number;
  uncollectedBalance: number;
}

const fetchDashboardStats = async (startDate?: Date, endDate?: Date) => {
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

  const { data: allTransactions } = await supabase
    .from("fee_transactions")
    .select("learner_id, amount_paid");

  const { data: allFeePayments } = await supabase
    .from("fee_payments")
    .select("learner_id, amount_paid");

  const totalExpectedFees = allInvoices?.reduce((sum, inv) => {
    const invoiceAmount = Number(inv.total_amount) - Number(inv.discount_amount || 0);
    return sum + invoiceAmount;
  }, 0) || 0;

  const totalPaidFromTransactions = allTransactions?.reduce(
    (sum, t) => sum + Number(t.amount_paid), 0
  ) || 0;

  const totalPaidFromPayments = allFeePayments?.reduce(
    (sum, p) => sum + Number(p.amount_paid), 0
  ) || 0;

  const totalPaid = totalPaidFromTransactions + totalPaidFromPayments;
  const uncollectedBalance = Math.max(0, totalExpectedFees - totalPaid);

  // ========== BALANCE BY GRADE CALCULATION ==========
  const { data: gradesData } = await supabase
    .from("grades")
    .select("id, name");

  const paymentsByLearner = new Map<string, number>();
  
  allTransactions?.forEach(t => {
    const current = paymentsByLearner.get(t.learner_id) || 0;
    paymentsByLearner.set(t.learner_id, current + Number(t.amount_paid));
  });
  
  allFeePayments?.forEach(p => {
    const current = paymentsByLearner.get(p.learner_id) || 0;
    paymentsByLearner.set(p.learner_id, current + Number(p.amount_paid));
  });

  const gradeBalanceMap = new Map<string, { name: string; expected: number; paid: number }>();

  gradesData?.forEach(grade => {
    gradeBalanceMap.set(grade.id, { name: grade.name, expected: 0, paid: 0 });
  });

  allInvoices?.forEach(inv => {
    const gradeId = inv.grade_id;
    const invoiceAmount = Number(inv.total_amount) - Number(inv.discount_amount || 0);
    
    const existing = gradeBalanceMap.get(gradeId);
    if (existing) {
      existing.expected += invoiceAmount;
    }
  });

  const invoicesByLearner = new Map<string, Array<{ grade_id: string; amount: number }>>();
  
  allInvoices?.forEach(inv => {
    const learnerInvoices = invoicesByLearner.get(inv.learner_id) || [];
    learnerInvoices.push({
      grade_id: inv.grade_id,
      amount: Number(inv.total_amount) - Number(inv.discount_amount || 0)
    });
    invoicesByLearner.set(inv.learner_id, learnerInvoices);
  });

  invoicesByLearner.forEach((invoices, learnerId) => {
    const totalLearnerPayments = paymentsByLearner.get(learnerId) || 0;
    const totalLearnerInvoices = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    if (totalLearnerInvoices > 0 && totalLearnerPayments > 0) {
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

  // Get house distribution
  const { data: housesData } = await supabase
    .from("houses")
    .select("id, name, color");

  const { data: learnerHouseCounts } = await supabase
    .from("learners")
    .select("house_id")
    .eq("status", "active")
    .not("house_id", "is", null);

  const houseCountMap = new Map<string, number>();
  learnerHouseCounts?.forEach(learner => {
    if (learner.house_id) {
      houseCountMap.set(
        learner.house_id,
        (houseCountMap.get(learner.house_id) || 0) + 1
      );
    }
  });

  const houseDistributionData = (housesData || []).map((house: any) => ({
    name: house.name,
    learners: houseCountMap.get(house.id) || 0,
    color: house.color,
  })).filter(h => h.learners > 0);

  // Get department distribution for teachers
  const { data: departmentsData } = await supabase
    .from("departments")
    .select("id, name");

  const { data: teacherDeptCounts } = await supabase
    .from("teachers")
    .select("department_id")
    .not("department_id", "is", null);

  const deptCountMap = new Map<string, number>();
  teacherDeptCounts?.forEach(teacher => {
    if (teacher.department_id) {
      deptCountMap.set(
        teacher.department_id,
        (deptCountMap.get(teacher.department_id) || 0) + 1
      );
    }
  });

  const departmentDistributionData = (departmentsData || []).map((dept: any) => ({
    name: dept.name,
    teachers: deptCountMap.get(dept.id) || 0,
  })).filter(d => d.teachers > 0);

  // Get recent payments
  const { data: paymentsHistoryData } = await supabase
    .from("fee_payments")
    .select(`
      id,
      receipt_number,
      amount_paid,
      payment_date,
      payment_method,
      status,
      created_at,
      learner:learners(
        admission_number,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    stats: {
      totalLearners: learnersCount || 0,
      totalAlumni: alumniCount || 0,
      activeStreams: streamsCount || 0,
      feeCollection: totalCollection,
      pendingAdmissions: 0,
      uncollectedBalance,
    } as DashboardStats,
    recentAdmissions: admissionsData || [],
    gradeDistribution: distribution,
    houseDistribution: houseDistributionData,
    departmentDistribution: departmentDistributionData,
    recentPayments: paymentsHistoryData || [],
    balanceByGrade: balanceByGradeData,
  };
};

export function useDashboardStats(startDate?: Date, endDate?: Date) {
  const queryKey = ['dashboardStats', startDate?.toISOString(), endDate?.toISOString()];
  
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchDashboardStats(startDate, endDate),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache persists for 30 minutes
  });

  return {
    stats: data?.stats || {
      totalLearners: 0,
      totalAlumni: 0,
      activeStreams: 0,
      feeCollection: 0,
      pendingAdmissions: 0,
      uncollectedBalance: 0,
    },
    recentAdmissions: data?.recentAdmissions || [],
    gradeDistribution: data?.gradeDistribution || [],
    houseDistribution: data?.houseDistribution || [],
    departmentDistribution: data?.departmentDistribution || [],
    recentPayments: data?.recentPayments || [],
    balanceByGrade: data?.balanceByGrade || [],
    loading: isLoading,
    fetchStats: refetch,
  };
}
