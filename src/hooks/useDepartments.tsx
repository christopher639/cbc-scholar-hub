import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
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
    fetchDepartments();
  }, []);

  const addDepartment = async (departmentData: { name: string; description?: string }) => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert([departmentData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Department created successfully",
      });
      
      fetchDepartments();
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

  const updateDepartment = async (id: string, departmentData: { name?: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from("departments")
        .update(departmentData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { departments, loading, fetchDepartments, addDepartment, updateDepartment, deleteDepartment };
}
