import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GradingScale {
  id: string;
  grade_name: string;
  min_percentage: number;
  max_percentage: number;
  points: number | null;
  description: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export function useGradingScales() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gradingScales = [], isLoading, refetch } = useQuery({
    queryKey: ["grading-scales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grading_scales")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as GradingScale[];
    },
  });

  const addGradingScale = useMutation({
    mutationFn: async (scale: {
      grade_name: string;
      min_percentage: number;
      max_percentage: number;
      points?: number;
      description?: string;
    }) => {
      const maxOrder = gradingScales.reduce(
        (max, s) => Math.max(max, s.display_order || 0),
        0
      );

      const { error } = await supabase.from("grading_scales").insert({
        grade_name: scale.grade_name,
        min_percentage: scale.min_percentage,
        max_percentage: scale.max_percentage,
        points: scale.points || 0,
        description: scale.description || null,
        display_order: maxOrder + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      toast({
        title: "Success",
        description: "Grading scale added successfully",
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

  const updateGradingScale = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      grade_name?: string;
      min_percentage?: number;
      max_percentage?: number;
      points?: number;
      description?: string;
      display_order?: number;
    }) => {
      const { error } = await supabase
        .from("grading_scales")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      toast({
        title: "Success",
        description: "Grading scale updated successfully",
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

  const deleteGradingScale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("grading_scales")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      toast({
        title: "Success",
        description: "Grading scale deleted successfully",
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

  // Helper function to get grade based on percentage
  const getGrade = (percentage: number): GradingScale | null => {
    return (
      gradingScales.find(
        (scale) =>
          percentage >= scale.min_percentage &&
          percentage <= scale.max_percentage
      ) || null
    );
  };

  return {
    gradingScales,
    isLoading,
    refetch,
    addGradingScale,
    updateGradingScale,
    deleteGradingScale,
    getGrade,
  };
}
