import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface House {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

const fetchHousesData = async () => {
  const { data, error } = await supabase
    .from("houses")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
};

export function useHouses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: houses = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['houses'],
    queryFn: fetchHousesData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const addHouse = async (houseData: { name: string; description?: string; color?: string }) => {
    try {
      const { data, error } = await supabase
        .from("houses")
        .insert([houseData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "House created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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

  const updateHouse = async (id: string, houseData: { name?: string; description?: string; color?: string }) => {
    try {
      const { error } = await supabase
        .from("houses")
        .update(houseData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "House updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['houses'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteHouse = async (id: string) => {
    try {
      const { error } = await supabase
        .from("houses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "House deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { houses, loading, fetchHouses: refetch, addHouse, updateHouse, deleteHouse };
}
