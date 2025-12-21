import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchFeeStructuresData = async () => {
  const { data, error } = await supabase
    .from("fee_structures")
    .select(`
      *,
      grade:grades(name),
      category:fee_categories(name),
      fee_structure_items(*)
    `)
    .order("academic_year", { ascending: false });

  if (error) throw error;
  return data || [];
};

export function useFeeStructures() {
  const queryClient = useQueryClient();

  const { data: structures = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: fetchFeeStructuresData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidateFeeStructures = () => {
    queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
  };

  return { structures, loading, fetchStructures: refetch, invalidateFeeStructures };
}
