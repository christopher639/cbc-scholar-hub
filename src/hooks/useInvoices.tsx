import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fetchInvoicesData = async (learnerId?: string) => {
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
  return data || [];
};

export function useInvoices(learnerId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['invoices', learnerId],
    queryFn: () => fetchInvoicesData(learnerId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

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

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    invoices,
    loading,
    fetchInvoices: refetch,
    generateInvoice,
    bulkGenerateInvoices,
    cancelInvoice,
  };
}
