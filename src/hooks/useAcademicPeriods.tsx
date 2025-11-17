import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAcademicPeriods() {
  const [academicPeriods, setAcademicPeriods] = useState<any[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAcademicPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("academic_periods")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      
      setAcademicPeriods(data || []);
      const current = data?.find(p => p.is_current);
      setCurrentPeriod(current || data?.[0] || null);
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
    fetchAcademicPeriods();
  }, []);

  return { academicPeriods, currentPeriod, loading, refetch: fetchAcademicPeriods };
}
