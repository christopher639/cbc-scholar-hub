import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFeePayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fee_payments")
        .select(`
          *,
          learner:learners(
            admission_number,
            first_name,
            last_name,
            current_grade:grades(name)
          )
        `)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
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
    fetchPayments();
  }, []);

  const addPayment = async (paymentData: any) => {
    try {
      const { data, error } = await supabase
        .from("fee_payments")
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      
      fetchPayments();
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

  return { payments, loading, fetchPayments, addPayment };
}
