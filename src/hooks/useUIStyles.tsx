import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UIStyles {
  sidebarStyle: string;
  cardStyle: string;
  heroGradient: string;
  pageBackground: string;
}

const SIDEBAR_STYLE_CLASSES: Record<string, string> = {
  "default": "bg-sidebar",
  "gradient-primary": "bg-gradient-to-b from-primary/90 via-primary to-primary/80 text-white",
  "gradient-dark": "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white",
  "gradient-ocean": "bg-gradient-to-b from-blue-600 via-cyan-600 to-teal-600 text-white",
  "gradient-sunset": "bg-gradient-to-b from-orange-500 via-rose-500 to-pink-600 text-white",
  "gradient-forest": "bg-gradient-to-b from-emerald-600 via-green-600 to-teal-700 text-white",
  "gradient-purple": "bg-gradient-to-b from-purple-600 via-violet-600 to-indigo-700 text-white",
  "gradient-midnight": "bg-gradient-to-b from-indigo-900 via-blue-900 to-slate-900 text-white",
};

const HERO_GRADIENT_CLASSES: Record<string, string> = {
  "primary": "bg-gradient-to-br from-primary/90 via-primary to-primary/80",
  "blue-purple": "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
  "green-teal": "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
  "rose-orange": "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500",
  "dark-elegant": "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
  "golden": "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600",
};

const PAGE_BACKGROUND_CLASSES: Record<string, string> = {
  "default": "bg-background",
  "subtle-gradient": "bg-gradient-to-br from-background via-background to-muted/30",
  "warm-gradient": "bg-gradient-to-br from-background via-orange-50/10 to-rose-50/10 dark:from-background dark:via-orange-950/10 dark:to-rose-950/10",
  "cool-gradient": "bg-gradient-to-br from-background via-blue-50/10 to-cyan-50/10 dark:from-background dark:via-blue-950/10 dark:to-cyan-950/10",
  "nature-gradient": "bg-gradient-to-br from-background via-green-50/10 to-emerald-50/10 dark:from-background dark:via-green-950/10 dark:to-emerald-950/10",
  "purple-gradient": "bg-gradient-to-br from-background via-purple-50/10 to-indigo-50/10 dark:from-background dark:via-purple-950/10 dark:to-indigo-950/10",
  "dotted-pattern": "bg-background bg-[radial-gradient(circle,_hsl(var(--muted))_1px,_transparent_1px)] bg-[size:20px_20px]",
  "grid-pattern": "bg-background bg-[linear-gradient(hsl(var(--muted)/0.3)_1px,_transparent_1px),_linear-gradient(90deg,_hsl(var(--muted)/0.3)_1px,_transparent_1px)] bg-[size:40px_40px]",
};

// Global styles cache
let stylesCache: UIStyles | null = null;
let stylesCacheLoaded = false;

export function useUIStyles() {
  const [styles, setStyles] = useState<UIStyles>(stylesCache || {
    sidebarStyle: "default",
    cardStyle: "default",
    heroGradient: "primary",
    pageBackground: "default",
  });
  const [loading, setLoading] = useState(!stylesCacheLoaded);

  useEffect(() => {
    if (stylesCacheLoaded && stylesCache) {
      setStyles(stylesCache);
      setLoading(false);
      return;
    }
    
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      const { data, error } = await supabase
        .from("appearance_settings")
        .select("sidebar_style, card_style, hero_gradient, page_background")
        .limit(1)
        .single();

      if (error) throw error;

      const fetchedStyles: UIStyles = {
        sidebarStyle: (data as any)?.sidebar_style || "default",
        cardStyle: (data as any)?.card_style || "default",
        heroGradient: (data as any)?.hero_gradient || "primary",
        pageBackground: (data as any)?.page_background || "default",
      };

      stylesCache = fetchedStyles;
      stylesCacheLoaded = true;
      setStyles(fetchedStyles);
    } catch (error) {
      console.error("Error fetching UI styles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSidebarClass = () => {
    return SIDEBAR_STYLE_CLASSES[styles.sidebarStyle] || SIDEBAR_STYLE_CLASSES["default"];
  };

  const getHeroGradientClass = () => {
    return HERO_GRADIENT_CLASSES[styles.heroGradient] || HERO_GRADIENT_CLASSES["primary"];
  };

  const getPageBackgroundClass = () => {
    return PAGE_BACKGROUND_CLASSES[styles.pageBackground] || PAGE_BACKGROUND_CLASSES["default"];
  };

  const isGradientSidebar = () => {
    return styles.sidebarStyle !== "default";
  };

  // Force refresh styles from database
  const refreshStyles = async () => {
    stylesCacheLoaded = false;
    stylesCache = null;
    await fetchStyles();
  };

  return {
    styles,
    loading,
    getSidebarClass,
    getHeroGradientClass,
    getPageBackgroundClass,
    isGradientSidebar,
    refreshStyles,
    SIDEBAR_STYLE_CLASSES,
    HERO_GRADIENT_CLASSES,
    PAGE_BACKGROUND_CLASSES,
  };
}

// Export for use in components that need direct access
export { SIDEBAR_STYLE_CLASSES, HERO_GRADIENT_CLASSES, PAGE_BACKGROUND_CLASSES };