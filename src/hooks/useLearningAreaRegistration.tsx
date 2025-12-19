import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GradeLearningArea {
  id: string;
  grade_id: string;
  learning_area_id: string;
  academic_year: string;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
  learning_areas?: {
    id: string;
    name: string;
    code: string;
  };
  grades?: {
    id: string;
    name: string;
  };
}

interface LearnerLearningArea {
  id: string;
  learner_id: string;
  learning_area_id: string;
  grade_id: string;
  academic_year: string;
  is_optional: boolean;
  created_at: string;
  updated_at: string;
  learning_areas?: {
    id: string;
    name: string;
    code: string;
  };
  learners?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  grades?: {
    id: string;
    name: string;
  };
}

export function useLearningAreaRegistration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch grade learning areas
  const { data: gradeLearningAreas = [], isLoading: loadingGradeLAs } = useQuery({
    queryKey: ["grade-learning-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_learning_areas")
        .select(`
          *,
          learning_areas:learning_area_id (id, name, code),
          grades:grade_id (id, name)
        `)
        .order("academic_year", { ascending: false });
      
      if (error) throw error;
      return data as GradeLearningArea[];
    },
  });

  // Fetch learner learning areas
  const { data: learnerLearningAreas = [], isLoading: loadingLearnerLAs } = useQuery({
    queryKey: ["learner-learning-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learner_learning_areas")
        .select(`
          *,
          learning_areas:learning_area_id (id, name, code),
          learners:learner_id (id, first_name, last_name, admission_number),
          grades:grade_id (id, name)
        `)
        .order("academic_year", { ascending: false });
      
      if (error) throw error;
      return data as LearnerLearningArea[];
    },
  });

  // Get learning areas for a specific grade and academic year
  const getLearningAreasForGrade = (gradeId: string, academicYear: string) => {
    return gradeLearningAreas.filter(
      gla => gla.grade_id === gradeId && gla.academic_year === academicYear
    );
  };

  // Get learning areas for a specific learner and academic year
  const getLearningAreasForLearner = (learnerId: string, academicYear: string) => {
    return learnerLearningAreas.filter(
      lla => lla.learner_id === learnerId && lla.academic_year === academicYear
    );
  };

  // Get all registered learning areas for a learner (grade + individual)
  const getAllRegisteredLearningAreas = (learnerId: string, gradeId: string, academicYear: string) => {
    const gradeLAs = getLearningAreasForGrade(gradeId, academicYear).map(gla => ({
      learning_area_id: gla.learning_area_id,
      learning_area: gla.learning_areas,
      source: 'grade' as const,
      is_mandatory: gla.is_mandatory
    }));

    const learnerLAs = getLearningAreasForLearner(learnerId, academicYear).map(lla => ({
      learning_area_id: lla.learning_area_id,
      learning_area: lla.learning_areas,
      source: 'individual' as const,
      is_optional: lla.is_optional
    }));

    // Combine and deduplicate (individual takes precedence)
    const learnerLAIds = new Set(learnerLAs.map(l => l.learning_area_id));
    const combined = [
      ...learnerLAs,
      ...gradeLAs.filter(g => !learnerLAIds.has(g.learning_area_id))
    ];

    return combined;
  };

  // Add learning areas to grade
  const addGradeLearningAreas = useMutation({
    mutationFn: async ({ gradeId, learningAreaIds, academicYear, isMandatory = true }: { 
      gradeId: string; 
      learningAreaIds: string[]; 
      academicYear: string;
      isMandatory?: boolean;
    }) => {
      const records = learningAreaIds.map(laId => ({
        grade_id: gradeId,
        learning_area_id: laId,
        academic_year: academicYear,
        is_mandatory: isMandatory
      }));

      const { error } = await supabase
        .from("grade_learning_areas")
        .upsert(records, { onConflict: 'grade_id,learning_area_id,academic_year' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-learning-areas"] });
      toast({
        title: "Success",
        description: "Learning areas registered for grade successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove learning area from grade
  const removeGradeLearningArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("grade_learning_areas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-learning-areas"] });
      toast({
        title: "Success",
        description: "Learning area removed from grade",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add learning areas to individual learner
  const addLearnerLearningAreas = useMutation({
    mutationFn: async ({ learnerId, gradeId, learningAreaIds, academicYear, isOptional = false }: { 
      learnerId: string;
      gradeId: string;
      learningAreaIds: string[]; 
      academicYear: string;
      isOptional?: boolean;
    }) => {
      const records = learningAreaIds.map(laId => ({
        learner_id: learnerId,
        grade_id: gradeId,
        learning_area_id: laId,
        academic_year: academicYear,
        is_optional: isOptional
      }));

      const { error } = await supabase
        .from("learner_learning_areas")
        .upsert(records, { onConflict: 'learner_id,learning_area_id,academic_year' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learner-learning-areas"] });
      toast({
        title: "Success",
        description: "Learning areas registered for learner successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove learning area from individual learner
  const removeLearnerLearningArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("learner_learning_areas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learner-learning-areas"] });
      toast({
        title: "Success",
        description: "Learning area removed from learner",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    gradeLearningAreas,
    learnerLearningAreas,
    loadingGradeLAs,
    loadingLearnerLAs,
    getLearningAreasForGrade,
    getLearningAreasForLearner,
    getAllRegisteredLearningAreas,
    addGradeLearningAreas,
    removeGradeLearningArea,
    addLearnerLearningAreas,
    removeLearnerLearningArea,
  };
}
