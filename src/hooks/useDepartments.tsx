import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const fetchDepartmentsData = async () => {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
};

export function useDepartments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartmentsData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const addDepartment = async (departmentData: { name: string; description?: string }) => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert([departmentData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Department created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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

  const updateDepartment = async (id: string, departmentData: { name?: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from("departments")
        .update(departmentData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['departments'] });
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

  return { departments, loading, fetchDepartments: refetch, addDepartment, updateDepartment, deleteDepartment };
}
