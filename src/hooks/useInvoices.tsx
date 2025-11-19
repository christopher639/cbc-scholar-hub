import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useInvoices(learnerId?: string) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("student_invoices")
        .select(`
          *,
          learner:learners(
            admission_number,
            first_name,
            last_name
          ),
          grade:grades(name),
          stream:streams(name),
          line_items:invoice_line_items(*)
        `)
        .order("issue_date", { ascending: false });

      if (learnerId) {
        query = query.eq("learner_id", learnerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
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

  const generateInvoice = async (
    learnerId: string,
    gradeId: string,
    streamId: string,
    academicYear: string,
    term: "term_1" | "term_2" | "term_3"
  ) => {
    try {
      const { data, error } = await supabase.rpc("generate_learner_invoice", {
        p_learner_id: learnerId,
        p_grade_id: gradeId,
        p_stream_id: streamId,
        p_academic_year: academicYear,
        p_term: term,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice generated successfully",
      });

      fetchInvoices();
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

  const bulkGenerateInvoices = async (
    academicYear: string,
    term: "term_1" | "term_2" | "term_3",
    gradeId?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc("bulk_generate_term_invoices", {
        p_academic_year: academicYear,
        p_term: term,
        p_grade_id: gradeId || null,
      });

      if (error) throw error;

      const successCount = data?.filter((r: any) => r.success).length || 0;
      
      toast({
        title: "Success",
        description: `Generated ${successCount} invoices successfully`,
      });

      fetchInvoices();
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

  const cancelInvoice = async (invoiceId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("student_invoices")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice cancelled successfully",
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [learnerId]);

  return {
    invoices,
    loading,
    fetchInvoices,
    generateInvoice,
    bulkGenerateInvoices,
    cancelInvoice,
  };
}
