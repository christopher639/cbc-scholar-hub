import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppearanceSettings {
  id: string;
  primary_color: string;
  created_at: string;
  updated_at: string;
}

const COLOR_PRESETS = [
  { name: "Blue", hsl: "210 85% 45%" },
  { name: "Green", hsl: "145 65% 42%" },
  { name: "Purple", hsl: "270 70% 50%" },
  { name: "Orange", hsl: "25 90% 50%" },
  { name: "Red", hsl: "0 72% 51%" },
  { name: "Teal", hsl: "180 70% 40%" },
  { name: "Pink", hsl: "330 80% 55%" },
  { name: "Indigo", hsl: "240 65% 55%" },
];

export function useAppearanceSettings() {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("appearance_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
      
      // Apply the color to CSS variables
      if (data?.primary_color) {
        applyPrimaryColor(data.primary_color);
      }
    } catch (error: any) {
      console.error("Error fetching appearance settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyPrimaryColor = (hslColor: string) => {
    document.documentElement.style.setProperty("--primary", hslColor);
    document.documentElement.style.setProperty("--ring", hslColor);
    
    // Also update dark mode primary (slightly brighter)
    const parts = hslColor.split(" ");
    if (parts.length === 3) {
      const lightness = parseInt(parts[2]);
      const darkLightness = Math.min(lightness + 10, 70);
      const darkPrimary = `${parts[0]} ${parts[1]} ${darkLightness}%`;
      // Store for dark mode
      document.documentElement.style.setProperty("--primary-dark", darkPrimary);
    }
  };

  const updateSettings = async (primaryColor: string) => {
    if (!settings) return false;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("appearance_settings")
        .update({ primary_color: primaryColor })
        .eq("id", settings.id);

      if (error) throw error;
      
      setSettings({ ...settings, primary_color: primaryColor });
      applyPrimaryColor(primaryColor);
      
      toast({
        title: "Success",
        description: "Appearance settings updated successfully",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    applyPrimaryColor,
    colorPresets: COLOR_PRESETS,
  };
}
