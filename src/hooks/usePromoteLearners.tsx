import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePromoteLearners() {
  const { toast } = useToast();

  const promoteLearners = async (
    learnerIds: string[],
    toGradeId: string,
    toStreamId: string,
    academicYear: string
  ) => {
    try {
      // Get current grade and stream for each learner
      const { data: learners, error: fetchError } = await supabase
        .from("learners")
        .select("id, current_grade_id, current_stream_id")
        .in("id", learnerIds);

      if (fetchError) throw fetchError;

      // Create promotion history records
      const promotionRecords = learners?.map((learner) => ({
        learner_id: learner.id,
        from_grade_id: learner.current_grade_id,
        from_stream_id: learner.current_stream_id,
        to_grade_id: toGradeId,
        to_stream_id: toStreamId,
        academic_year: academicYear,
        promotion_date: new Date().toISOString().split('T')[0],
      }));

      const { error: historyError } = await supabase
        .from("promotion_history")
        .insert(promotionRecords || []);

      if (historyError) throw historyError;

      // Update learners with new grade and stream
      const { error: updateError } = await supabase
        .from("learners")
        .update({
          current_grade_id: toGradeId,
          current_stream_id: toStreamId,
        })
        .in("id", learnerIds);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `${learnerIds.length} learner(s) promoted successfully`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return { promoteLearners };
}
