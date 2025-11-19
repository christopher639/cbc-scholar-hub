import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useTransactions(invoiceId?: string, learnerId?: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("fee_transactions")
        .select(`
          *,
          learner:learners(
            admission_number,
            first_name,
            last_name
          ),
          invoice:student_invoices(
            invoice_number,
            academic_year,
            term
          )
        `)
        .order("payment_date", { ascending: false });

      if (invoiceId) {
        query = query.eq("invoice_id", invoiceId);
      }

      if (learnerId) {
        query = query.eq("learner_id", learnerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
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

  const recordPayment = async (paymentData: {
    invoice_id: string;
    learner_id: string;
    amount_paid: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  }) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("fee_transactions")
        .insert([
          {
            ...paymentData,
            recorded_by: user.data.user?.id,
            transaction_number: await generateTransactionNumber(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      fetchTransactions();
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const generateTransactionNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc("generate_transaction_number");
    if (error) throw error;
    return data;
  };

  useEffect(() => {
    fetchTransactions();
  }, [invoiceId, learnerId]);

  return {
    transactions,
    loading,
    fetchTransactions,
    recordPayment,
  };
}
