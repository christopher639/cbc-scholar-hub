import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useLearningAreas() {
  const [learningAreas, setLearningAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLearningAreas = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("learning_areas")
        .select(`
          *,
          teacher:teachers(first_name, last_name)
        `);

      // If user is a teacher, get their teacher ID first and filter learning areas
      if (user?.role === 'teacher') {
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (teacherData) {
          query = query.eq('teacher_id', teacherData.id);
        }
      }
      
      const { data, error } = await query.order("name", { ascending: true });

      if (error) throw error;
      setLearningAreas(data || []);
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
    fetchLearningAreas();
  }, []);

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
      
      fetchLearningAreas();
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
      
      fetchLearningAreas();
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
      
      fetchLearningAreas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { learningAreas, loading, fetchLearningAreas, addLearningArea, updateLearningArea, deleteLearningArea };
}
