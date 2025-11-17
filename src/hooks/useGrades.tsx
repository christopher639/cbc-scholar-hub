import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGrades() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("grades")
        .select(`
          *,
          streams(*)
        `)
        .order("grade_level", { ascending: true });

      if (error) throw error;
      setGrades(data || []);
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
    fetchGrades();
  }, []);

  return { grades, loading, fetchGrades };
}
