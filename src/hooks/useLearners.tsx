import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fetchLearnersData = async (gradeId?: string, streamId?: string) => {
  let query = supabase
    .from("learners")
    .select(`
      *,
      current_grade:grades(name, grade_level),
      current_stream:streams(name),
      stream:streams(name),
      parent:parents(*)
    `);

  if (gradeId) {
    query = query.eq("current_grade_id", gradeId);
  }
  if (streamId) {
    query = query.eq("current_stream_id", streamId);
  }

  // Only fetch active learners (exclude alumni and transferred)
  query = query.eq("status", "active");

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export function useLearners(gradeId?: string, streamId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: learners = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['learners', gradeId, streamId],
    queryFn: () => fetchLearnersData(gradeId, streamId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const addLearner = async (learnerData: any) => {
    try {
      // First create the auth user account if birth certificate number is provided
      let userId = null;
      if (learnerData.birth_certificate_number) {
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
        } else if (authData.user) {
          userId = authData.user.id;
        }
      }

      const learnerInsertData = userId ? { ...learnerData, user_id: userId } : learnerData;
      const { data, error } = await supabase
        .from("learners")
        .insert([learnerInsertData])
        .select()
        .single();

      if (error) throw error;
      
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
      
      // Invalidate all learner queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['learners'] });
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

  return { learners, loading, fetchLearners: refetch, addLearner };
}
