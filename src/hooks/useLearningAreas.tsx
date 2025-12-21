import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const fetchLearningAreasData = async (user: any) => {
  let query = supabase
    .from("learning_areas")
    .select(`
      *,
      teacher:teachers(first_name, last_name)
    `);

  // If user is a teacher, filter to show only their assigned learning areas
  if (user?.role === 'teacher') {
    const teacherSession = localStorage.getItem("teacher_session");
    
    if (teacherSession) {
      const { data: sessionData } = await supabase
        .from("teacher_sessions")
        .select("teacher_id")
        .eq("session_token", teacherSession)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (sessionData) {
        query = query.eq('teacher_id', sessionData.teacher_id);
      }
    } else {
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherData) {
        query = query.eq('teacher_id', teacherData.id);
      }
    }
  }
  
  const { data, error } = await query.order("name", { ascending: true });

  if (error) throw error;
  return data || [];
};

export function useLearningAreas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: learningAreas = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['learningAreas', user?.id, user?.role],
    queryFn: () => fetchLearningAreasData(user),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const addLearningArea = async (areaData: any) => {
    try {
      const { data, error } = await supabase
        .from("learning_areas")
        .insert([areaData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Learning area added successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['learningAreas'] });
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

  const updateLearningArea = async (id: string, areaData: any) => {
    try {
      const { error } = await supabase
        .from("learning_areas")
        .update(areaData)
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Learning area updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['learningAreas'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteLearningArea = async (id: string) => {
    try {
      const { error } = await supabase
        .from("learning_areas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Learning area deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['learningAreas'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { learningAreas, loading, fetchLearningAreas: refetch, addLearningArea, updateLearningArea, deleteLearningArea };
}
