import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdmissionNumberSettings {
  id: string;
  prefix: string;
  current_number: number;
  padding: number;
}

export function useAdmissionNumberSettings() {
  const [settings, setSettings] = useState<AdmissionNumberSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("admission_number_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
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

  const updateSettings = async (updates: Partial<Omit<AdmissionNumberSettings, 'id'>>) => {
    try {
      if (!settings) return false;

      const { error } = await supabase
        .from("admission_number_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admission number settings updated successfully",
      });

      await fetchSettings();
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, updateSettings };
}
