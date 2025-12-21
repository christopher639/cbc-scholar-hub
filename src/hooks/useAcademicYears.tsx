import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchAcademicYearsData = async () => {
  const { data, error } = await supabase
    .from("academic_years")
    .select("*")
    .order("year", { ascending: false });

  if (error) throw error;
  
  const active = data?.find(y => y.is_active);
  return {
    years: data || [],
    currentYear: active || data?.[0] || null,
  };
};

export function useAcademicYears() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['academicYears'],
    queryFn: fetchAcademicYearsData,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    academicYears: data?.years || [],
    currentYear: data?.currentYear || null,
    loading,
    refetch,
  };
}
