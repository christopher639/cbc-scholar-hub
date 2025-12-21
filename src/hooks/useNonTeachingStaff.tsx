import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fetchNonTeachingStaffData = async () => {
  const { data, error } = await supabase
    .from("non_teaching_staff")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export function useNonTeachingStaff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['nonTeachingStaff'],
    queryFn: fetchNonTeachingStaffData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const addStaff = async (staffData: any) => {
    try {
      const { data, error } = await supabase
        .from("non_teaching_staff")
        .insert([staffData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['nonTeachingStaff'] });
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

  const updateStaff = async (id: string, staffData: any) => {
    try {
      const { error } = await supabase
        .from("non_teaching_staff")
        .update(staffData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['nonTeachingStaff'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const { error } = await supabase
        .from("non_teaching_staff")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['nonTeachingStaff'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { staff, loading, fetchStaff: refetch, addStaff, updateStaff, deleteStaff };
}
