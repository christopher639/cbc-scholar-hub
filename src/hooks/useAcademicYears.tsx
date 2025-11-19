import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAcademicYears() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;
      
      setAcademicYears(data || []);
      const active = data?.find(y => y.is_active);
      setCurrentYear(active || data?.[0] || null);
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
    fetchAcademicYears();
  }, []);

  return { academicYears, currentYear, loading, refetch: fetchAcademicYears };
}
