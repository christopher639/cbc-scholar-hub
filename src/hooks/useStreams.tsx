import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fetchStreamsData = async (gradeId?: string) => {
  let query = supabase
    .from("streams")
    .select("*");

  if (gradeId) {
    query = query.eq("grade_id", gradeId);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) throw error;
  return data || [];
};

export function useStreams(gradeId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: streams = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['streams', gradeId],
    queryFn: () => fetchStreamsData(gradeId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const addStream = async (streamData: any) => {
    try {
      const { data, error } = await supabase
        .from("streams")
        .insert([streamData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Stream created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['grades'] });
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

  return { streams, loading, fetchStreams: refetch, addStream };
}
