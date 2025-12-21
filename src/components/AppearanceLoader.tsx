import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppearanceLoader() {
  useEffect(() => {
    const loadAppearance = async () => {
      try {
        const { data, error } = await supabase
          .from("appearance_settings")
          .select("primary_color")
          .limit(1)
          .single();

        if (error) {
          console.error("Error loading appearance settings:", error);
          return;
        }

        if (data?.primary_color) {
          document.documentElement.style.setProperty("--primary", data.primary_color);
          document.documentElement.style.setProperty("--ring", data.primary_color);
        }
      } catch (error) {
        console.error("Error loading appearance settings:", error);
      }
    };

    loadAppearance();
  }, []);

  return null;
}
