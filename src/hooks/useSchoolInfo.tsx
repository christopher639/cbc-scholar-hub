import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSchoolInfo() {
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchoolInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("school_info")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSchoolInfo(data);
    } catch (error: any) {
      console.error("Error fetching school info:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSchoolInfo = async (data: any) => {
    try {
      const { data: existingData } = await supabase
        .from("school_info")
        .select("id")
        .single();

      if (existingData) {
        const { error } = await supabase
          .from("school_info")
          .update(data)
          .eq("id", existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("school_info")
          .insert(data);

        if (error) throw error;
      }

      await fetchSchoolInfo();
      toast({
        title: "Success",
        description: "School information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSchoolInfo();
  }, []);

  return { schoolInfo, loading, updateSchoolInfo, fetchSchoolInfo };
}
