import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppearanceLoader() {
  useEffect(() => {
    const loadAppearance = async () => {
      try {
        const { data, error } = await supabase
          .from("appearance_settings")
          .select("primary_color, sidebar_style, card_style, hero_gradient, page_background")
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

        // Apply UI style settings as data attributes
        const anyData = data as any;
        if (anyData?.sidebar_style) {
          document.documentElement.setAttribute("data-sidebar-style", anyData.sidebar_style);
        }
        if (anyData?.card_style) {
          document.documentElement.setAttribute("data-card-style", anyData.card_style);
        }
        if (anyData?.hero_gradient) {
          document.documentElement.setAttribute("data-hero-gradient", anyData.hero_gradient);
        }
        if (anyData?.page_background) {
          document.documentElement.setAttribute("data-page-background", anyData.page_background);
        }
      } catch (error) {
        console.error("Error loading appearance settings:", error);
      }
    };

    loadAppearance();
  }, []);

  return null;
}
