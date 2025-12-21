import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fetchSchoolInfoData = async () => {
  const { data, error } = await supabase
    .from("school_info")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
};

export function useSchoolInfo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schoolInfo, isLoading: loading, refetch } = useQuery({
    queryKey: ['schoolInfo'],
    queryFn: fetchSchoolInfoData,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const updateSchoolInfo = async (data: any) => {
    try {
      const { data: existingData } = await supabase
        .from("school_info")
        .select("id")
        .single();

      if (existingData) {
        const { error } = await supabase
          .from("school_info")
          .update(data)
          .eq("id", existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("school_info")
          .insert(data);

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['schoolInfo'] });
      toast({
        title: "Success",
        description: "School information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { schoolInfo: schoolInfo || null, loading, updateSchoolInfo, fetchSchoolInfo: refetch };
}
