import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PerformanceFormula {
  id: string;
  name: string;
  description: string | null;
  formula_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormulaExamWeight {
  id: string;
  formula_id: string;
  exam_type_id: string;
  weight: number;
  created_at: string;
  updated_at: string;
  exam_type?: {
    id: string;
    name: string;
    max_marks: number;
  };
}

export function usePerformanceFormulas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all formulas
  const { data: formulas = [], isLoading: formulasLoading, refetch: refetchFormulas } = useQuery({
    queryKey: ["performance-formulas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_formulas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PerformanceFormula[];
    },
  });

  // Fetch all formula weights with exam type info
  const { data: formulaWeights = [], isLoading: weightsLoading, refetch: refetchWeights } = useQuery({
    queryKey: ["formula-exam-weights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formula_exam_weights")
        .select(`
          *,
          exam_type:exam_types(id, name, max_marks)
        `)
        .order("created_at");

      if (error) throw error;
      return data as FormulaExamWeight[];
    },
  });

  // Get the active formula
  const activeFormula = formulas.find(f => f.is_active) || null;

  // Get weights for a specific formula
  const getFormulaWeights = (formulaId: string) => {
    return formulaWeights.filter(w => w.formula_id === formulaId);
  };

  // Create a new formula
  const createFormula = useMutation({
    mutationFn: async (formula: {
      name: string;
      description?: string;
      formula_type?: string;
    }) => {
      const { data, error } = await supabase
        .from("performance_formulas")
        .insert({
          name: formula.name,
          description: formula.description || null,
          formula_type: formula.formula_type || "weighted_average",
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-formulas"] });
      toast({
        title: "Success",
        description: "Formula created successfully",
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

  // Update formula
  const updateFormula = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string;
      formula_type?: string;
    }) => {
      const { error } = await supabase
        .from("performance_formulas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-formulas"] });
      toast({
        title: "Success",
        description: "Formula updated successfully",
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

  // Set active formula
  const setActiveFormula = useMutation({
    mutationFn: async (formulaId: string) => {
      // First, set all formulas to inactive
      await supabase
        .from("performance_formulas")
        .update({ is_active: false })
        .neq("id", formulaId);

      // Set the selected formula to active
      const { error } = await supabase
        .from("performance_formulas")
        .update({ is_active: true })
        .eq("id", formulaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-formulas"] });
      toast({
        title: "Success",
        description: "Active formula updated",
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

  // Delete formula
  const deleteFormula = useMutation({
    mutationFn: async (id: string) => {
      // Delete weights first
      await supabase
        .from("formula_exam_weights")
        .delete()
        .eq("formula_id", id);

      // Delete formula
      const { error } = await supabase
        .from("performance_formulas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-formulas"] });
      queryClient.invalidateQueries({ queryKey: ["formula-exam-weights"] });
      toast({
        title: "Success",
        description: "Formula deleted successfully",
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

  // Add/Update exam weight for a formula
  const saveFormulaWeight = useMutation({
    mutationFn: async ({
      formulaId,
      examTypeId,
      weight,
    }: {
      formulaId: string;
      examTypeId: string;
      weight: number;
    }) => {
      // Check if weight already exists
      const { data: existing } = await supabase
        .from("formula_exam_weights")
        .select("id")
        .eq("formula_id", formulaId)
        .eq("exam_type_id", examTypeId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("formula_exam_weights")
          .update({ weight })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("formula_exam_weights")
          .insert({ formula_id: formulaId, exam_type_id: examTypeId, weight });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formula-exam-weights"] });
      toast({
        title: "Success",
        description: "Weight saved",
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

  // Delete exam weight
  const deleteFormulaWeight = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("formula_exam_weights")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formula-exam-weights"] });
      toast({
        title: "Success",
        description: "Weight removed",
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

  // Calculate simple average: (sum of all exam scores) / (number of exam types with scores)
  // Formula: Subject Average = (Opener + Mid-Term + End Term + RAT + ...) / total number of exam types
  const calculateWeightedAverage = (
    examScores: Record<string, number | null>,
    examTypes: { id: string; name: string; max_marks: number }[]
  ): number | null => {
    // Get all scores that are not null
    const validScores: { score: number; maxMarks: number }[] = [];
    
    examTypes.forEach(et => {
      const score = examScores[et.name];
      if (score !== null && score !== undefined) {
        validScores.push({
          score: Number(score),
          maxMarks: et.max_marks || 100
        });
      }
    });
    
    if (validScores.length === 0) return null;
    
    // Calculate percentage for each exam and sum them
    // Then divide by the number of exams to get average percentage
    const totalPercentage = validScores.reduce((sum, item) => {
      const percentage = (item.score / item.maxMarks) * 100;
      return sum + percentage;
    }, 0);
    
    return totalPercentage / validScores.length;
  };

  return {
    formulas,
    formulaWeights,
    activeFormula,
    isLoading: formulasLoading || weightsLoading,
    refetch: () => {
      refetchFormulas();
      refetchWeights();
    },
    getFormulaWeights,
    createFormula,
    updateFormula,
    setActiveFormula,
    deleteFormula,
    saveFormulaWeight,
    deleteFormulaWeight,
    calculateWeightedAverage,
  };
}
