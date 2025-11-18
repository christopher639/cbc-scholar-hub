import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLearners(gradeId?: string, streamId?: string) {
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLearners = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades(name, grade_level),
          current_stream:streams(name),
          parent:parents(*)
        `);

      if (gradeId) {
        query = query.eq("current_grade_id", gradeId);
      }
      if (streamId) {
        query = query.eq("current_stream_id", streamId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setLearners(data || []);
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
    fetchLearners();
  }, [gradeId, streamId]);

  const addLearner = async (learnerData: any) => {
    try {
      const { data, error } = await supabase
        .from("learners")
        .insert([learnerData])
        .select()
        .single();

      if (error) throw error;
      
      // Create user_role entry for the learner (student role)
      if (data) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.id,
            role: "student",
          });
        
        if (roleError) {
          console.error("Error creating user role:", roleError);
        }
      }
      
      toast({
        title: "Success",
        description: "Learner added successfully",
      });
      
      fetchLearners();
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

  return { learners, loading, fetchLearners, addLearner };
}
