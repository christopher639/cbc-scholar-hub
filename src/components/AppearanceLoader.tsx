import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APP_THEMES } from "@/hooks/useUIStyles";

export function AppearanceLoader() {
  useEffect(() => {
    const loadAppearance = async () => {
      try {
        const { data, error } = await supabase
          .from("appearance_settings")
          .select("primary_color, sidebar_style, card_style, hero_gradient, page_background, app_theme")
          .limit(1)
          .single();

        if (error) {
          console.error("Error loading appearance settings:", error);
          return;
        }

        const anyData = data as any;
        
        // Check if an app theme is selected and apply its CSS variables
        if (anyData?.app_theme && anyData.app_theme !== "default") {
          const theme = APP_THEMES[anyData.app_theme as keyof typeof APP_THEMES];
          if (theme && theme.cssVars) {
            Object.entries(theme.cssVars).forEach(([key, value]) => {
              document.documentElement.style.setProperty(key, value);
            });
          }
          document.documentElement.setAttribute("data-app-theme", anyData.app_theme);
        } else {
          // Apply primary color only if no theme is selected
          if (data?.primary_color) {
            document.documentElement.style.setProperty("--primary", data.primary_color);
            document.documentElement.style.setProperty("--ring", data.primary_color);
          }
        }

        // Apply UI style settings as data attributes
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
