import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

interface FeeBalanceParams {
  gradeId?: string;
  streamId?: string;
  academicYear: string;
  term: Term;
}

export function useFeeBalances({ gradeId, streamId, academicYear, term }: FeeBalanceParams) {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBalances = async () => {
    try {
      setLoading(true);

      // Build learner query
      let learnerQuery = supabase
        .from("learners")
        .select(`
          id,
          admission_number,
          first_name,
          last_name,
          current_grade_id,
          current_stream_id,
          current_grade:grades(name),
          current_stream:streams(name)
        `);

      if (gradeId) {
        learnerQuery = learnerQuery.eq("current_grade_id", gradeId);
      }
      if (streamId) {
        learnerQuery = learnerQuery.eq("current_stream_id", streamId);
      }

      const { data: learners, error: learnersError } = await learnerQuery;
      if (learnersError) throw learnersError;

      // Fetch fee structure for the grade/term/year
      const { data: feeStructures } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("grade_id", gradeId || "")
        .eq("academic_year", academicYear)
        .eq("term", term);

      // Calculate balances for each learner
      const balancesData = await Promise.all(
        (learners || []).map(async (learner) => {
          // Get fee structure for this learner's grade
          const { data: structure } = await supabase
            .from("fee_structures")
            .select("id, amount")
            .eq("grade_id", learner.current_grade_id)
            .eq("academic_year", academicYear)
            .eq("term", term)
            .maybeSingle();

          const totalFees = structure?.amount || 0;

          // Get payments from both fee_payments and fee_transactions for this specific grade/term/year
          const { data: feePayments } = await supabase
            .from("fee_payments")
            .select(`
              amount_paid,
              payment_date,
              fee_structure_id,
              fee_structures!inner(
                grade_id,
                academic_year,
                term
              )
            `)
            .eq("learner_id", learner.id)
            .eq("fee_structures.grade_id", learner.current_grade_id)
            .eq("fee_structures.academic_year", academicYear)
            .eq("fee_structures.term", term);

          const { data: feeTransactions } = await supabase
            .from("fee_transactions")
            .select("amount_paid, payment_date, invoice_id")
            .eq("learner_id", learner.id);

          // Filter transactions that belong to the current term/year by checking their invoices
          const { data: relevantInvoices } = await supabase
            .from("student_invoices")
            .select("id")
            .eq("learner_id", learner.id)
            .eq("grade_id", learner.current_grade_id)
            .eq("academic_year", academicYear)
            .eq("term", term);

          const relevantInvoiceIds = new Set(relevantInvoices?.map(inv => inv.id) || []);
          const filteredTransactions = feeTransactions?.filter(t => relevantInvoiceIds.has(t.invoice_id)) || [];

          const amountFromPayments = feePayments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
          const amountFromTransactions = filteredTransactions?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;
          const amountPaid = amountFromPayments + amountFromTransactions;
          const balance = Math.max(0, totalFees - amountPaid);

          return {
            ...learner,
            totalFees,
            amountPaid,
            balance,
            status: balance === 0 ? "paid" : amountPaid > 0 ? "partial" : "pending",
          };
        })
      );

      setBalances(balancesData);
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
    if (academicYear && term) {
      fetchBalances();
    }
  }, [gradeId, streamId, academicYear, term]);

  return { balances, loading, refetch: fetchBalances };
}
