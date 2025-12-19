import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ExamType {
  id: string;
  name: string;
  description: string | null;
  display_order: number | null;
  is_active: boolean | null;
  max_marks: number;
  created_at: string;
  updated_at: string;
}

export function useExamTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: examTypes = [], isLoading, refetch } = useQuery({
    queryKey: ["exam-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_types")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ExamType[];
    },
  });

  const addExamType = useMutation({
    mutationFn: async ({ name, description, max_marks }: { name: string; description?: string; max_marks?: number }) => {
      const maxOrder = examTypes.length > 0 
        ? Math.max(...examTypes.map(e => e.display_order || 0)) 
        : 0;

      const { data, error } = await supabase
        .from("exam_types")
        .insert({ 
          name, 
          description,
          max_marks: max_marks || 100,
          display_order: maxOrder + 1 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-types"] });
      toast({
        title: "Success",
        description: "Exam type created successfully",
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

  const updateExamType = useMutation({
    mutationFn: async ({ id, name, description, is_active, max_marks }: { 
      id: string; 
      name?: string; 
      description?: string;
      is_active?: boolean;
      max_marks?: number;
    }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (is_active !== undefined) updates.is_active = is_active;
      if (max_marks !== undefined) updates.max_marks = max_marks;

      const { data, error } = await supabase
        .from("exam_types")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-types"] });
      toast({
        title: "Success",
        description: "Exam type updated successfully",
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

  const deleteExamType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("exam_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-types"] });
      toast({
        title: "Success",
        description: "Exam type deleted successfully",
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
    examTypes,
    isLoading,
    refetch,
    addExamType,
    updateExamType,
    deleteExamType,
  };
}
