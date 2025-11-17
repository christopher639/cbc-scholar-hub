import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useStreams(gradeId?: string) {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStreams = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("streams")
        .select("*");

      if (gradeId) {
        query = query.eq("grade_id", gradeId);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) throw error;
      setStreams(data || []);
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
    fetchStreams();
  }, [gradeId]);

  const addStream = async (streamData: any) => {
    try {
      const { data, error } = await supabase
        .from("streams")
        .insert([streamData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Stream created successfully",
      });
      
      fetchStreams();
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

  return { streams, loading, fetchStreams, addStream };
}
