import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLearnerDetail(learnerId: string) {
  const [learner, setLearner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLearnerDetail = async () => {
    try {
      setLoading(true);

      // Fetch learner with all related data
      const { data: learnerData, error: learnerError } = await supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades(id, name, grade_level),
          current_stream:streams(id, name),
          parent:parents(*)
        `)
        .eq("id", learnerId)
        .single();

      if (learnerError) throw learnerError;

      // Get current academic period (priority) or fallback to active year
      const { data: currentPeriod } = await supabase
        .from("academic_periods")
        .select("term, academic_year")
        .eq("is_current", true)
        .maybeSingle();

      const { data: currentYear } = await supabase
        .from("academic_years")
        .select("year")
        .eq("is_active", true)
        .maybeSingle();

      // Fetch promotion history
      const { data: promotionHistory } = await supabase
        .from("promotion_history")
        .select(`
          *,
          from_grade:grades!promotion_history_from_grade_id_fkey(name),
          to_grade:grades!promotion_history_to_grade_id_fkey(name),
          from_stream:streams!promotion_history_from_stream_id_fkey(name),
          to_stream:streams!promotion_history_to_stream_id_fkey(name)
        `)
        .eq("learner_id", learnerId)
        .order("promotion_date", { ascending: false });

      // Fetch performance records
      const { data: performance } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          academic_period:academic_periods(academic_year, term)
        `)
        .eq("learner_id", learnerId)
        .order("created_at", { ascending: false });

      // Get ALL invoices for this learner (cumulative across all terms)
      const { data: allInvoices } = await supabase
        .from("student_invoices")
        .select("total_amount, amount_paid, balance_due, status, academic_year, term")
        .eq("learner_id", learnerId)
        .neq("status", "cancelled")
        .order("created_at", { ascending: true });

      // Get all fee transactions for this learner
      const { data: transactions } = await supabase
        .from("fee_transactions")
        .select(`
          *,
          invoice:student_invoices(invoice_number, academic_year, term)
        `)
        .eq("learner_id", learnerId)
        .order("payment_date", { ascending: false });

      // Also get fee_payments records (legacy payment system)
      const { data: feePayments } = await supabase
        .from("fee_payments")
        .select(`
          *,
          fee_structure:fee_structures(academic_year, term)
        `)
        .eq("learner_id", learnerId)
        .order("payment_date", { ascending: false });

      // Calculate cumulative totals
      const totalAccumulatedFees = allInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      
      // Calculate total paid from BOTH fee_transactions and fee_payments
      const totalFromTransactions = transactions?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;
      const totalFromFeePayments = feePayments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const totalPaid = totalFromTransactions + totalFromFeePayments;
      
      const totalBalance = totalAccumulatedFees - totalPaid;

      // Get current term invoice
      const currentTermInvoice = allInvoices?.find(
        inv => inv.academic_year === (currentPeriod?.academic_year || currentYear?.year) && 
               inv.term === (currentPeriod?.term || "term_1")
      );

      const currentTermFees = currentTermInvoice?.total_amount || 0;
      const currentTermPaid = currentTermInvoice?.amount_paid || 0;
      const currentTermBalance = currentTermInvoice?.balance_due || 0;

      setLearner({
        ...learnerData,
        promotionHistory: promotionHistory || [],
        performance: performance || [],
        currentAcademicYear: currentPeriod?.academic_year || currentYear?.year || "Not Set",
        currentTerm: currentPeriod?.term || "Not Set",
        feeInfo: {
          // Cumulative totals
          totalAccumulatedFees,
          totalPaid,
          totalBalance,
          // Current term
          currentTermFees,
          currentTermPaid,
          currentTermBalance,
          // Details
          allInvoices: allInvoices || [],
          transactions: transactions || [],
          feePayments: feePayments || [], // Include legacy payments
        },
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
    if (learnerId) {
      fetchLearnerDetail();
    }
  }, [learnerId]);

  return { learner, loading, refetch: fetchLearnerDetail };
}
