import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppearanceLoader() {
  useEffect(() => {
    const loadAppearance = async () => {
      try {
        const { data, error } = await supabase
          .from("appearance_settings")
          .select("primary_color, sidebar_style, card_style, hero_gradient")
          .limit(1)
          .single();

        if (error) {
          console.error("Error loading appearance settings:", error);
          return;
        }

        // Apply primary color
        if (data?.primary_color) {
          document.documentElement.style.setProperty("--primary", data.primary_color);
          document.documentElement.style.setProperty("--ring", data.primary_color);
        }

        // Apply UI style settings
        if (data?.sidebar_style) {
          document.documentElement.setAttribute("data-sidebar-style", data.sidebar_style);
        }
        if (data?.card_style) {
          document.documentElement.setAttribute("data-card-style", data.card_style);
        }
        if (data?.hero_gradient) {
          document.documentElement.setAttribute("data-hero-gradient", data.hero_gradient);
        }
      } catch (error) {
        console.error("Error loading appearance settings:", error);
      }
    };

    loadAppearance();
  }, []);

  return null;
}
