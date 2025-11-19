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
      // First create the auth user account if birth certificate number is provided
      let userId = null;
      if (learnerData.birth_certificate_number) {
        // Create auth account with admission number as email and birth cert as password
        const tempEmail = `${learnerData.admission_number || 'temp'}@learner.temp`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: learnerData.birth_certificate_number,
          options: {
            data: {
              admission_number: learnerData.admission_number,
              is_learner: true,
            }
          }
        });

        if (authError) {
          console.error("Error creating auth user:", authError);
          // Continue even if auth creation fails
        } else if (authData.user) {
          userId = authData.user.id;
        }
      }

      // Insert learner record
      const learnerInsertData = userId ? { ...learnerData, user_id: userId } : learnerData;
      const { data, error } = await supabase
        .from("learners")
        .insert([learnerInsertData])
        .select()
        .single();

      if (error) throw error;
      
      // Create user_role entry for the learner
      if (data && userId) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "learner",
          });
        
        if (roleError) {
          console.error("Error creating user role:", roleError);
        }
      }
      
      toast({
        title: "Success",
        description: "Learner added successfully" + (userId ? " and can now log in" : ""),
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
