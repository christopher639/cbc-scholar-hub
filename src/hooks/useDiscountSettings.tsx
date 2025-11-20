import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DiscountSetting {
  id: string;
  discount_type: string;
  percentage: number;
  is_enabled: boolean;
}

export function useDiscountSettings() {
  const [settings, setSettings] = useState<DiscountSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("discount_settings")
        .select("*")
        .order("discount_type");

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading discount settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: { discount_type: string; percentage: number; is_enabled: boolean }[]) => {
    try {
      // Delete existing settings
      await supabase.from("discount_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert new settings
      const { error } = await supabase.from("discount_settings").insert(updates);

      if (error) throw error;

      toast({
        title: "Discount Settings Saved",
        description: "Fee discount policies have been updated successfully",
      });

      await fetchSettings();
      return true;
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
