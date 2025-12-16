import { useEffect, useState } from "react";
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

export function useHouses() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("houses")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setHouses(data || []);
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
    fetchHouses();
  }, []);

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
      
      fetchHouses();
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
      
      fetchHouses();
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
      
      fetchHouses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { houses, loading, fetchHouses, addHouse, updateHouse, deleteHouse };
}
