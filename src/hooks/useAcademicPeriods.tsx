import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchAcademicPeriodsData = async () => {
  const { data, error } = await supabase
    .from("academic_periods")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw error;
  
  const current = data?.find(p => p.is_current);
  return {
    periods: data || [],
    currentPeriod: current || data?.[0] || null,
  };
};

export function useAcademicPeriods() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['academicPeriods'],
    queryFn: fetchAcademicPeriodsData,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    academicPeriods: data?.periods || [],
    currentPeriod: data?.currentPeriod || null,
    loading,
    refetch,
  };
}
