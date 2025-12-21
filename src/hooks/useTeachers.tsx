import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fetchTeachersData = async () => {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export function useTeachers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['teachers'],
    queryFn: fetchTeachersData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const addTeacher = async (teacherData: any) => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .insert([teacherData])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.id,
            role: "teacher",
          });
        
        if (roleError) {
          console.error("Error creating user role:", roleError);
        }
      }
      
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
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

  const updateTeacher = async (id: string, teacherData: any) => {
    try {
      const { error } = await supabase
        .from("teachers")
        .update(teacherData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
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

  return { teachers, loading, fetchTeachers: refetch, addTeacher, updateTeacher, deleteTeacher };
}
