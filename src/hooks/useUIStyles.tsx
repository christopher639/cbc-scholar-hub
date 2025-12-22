import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UIStyles {
  sidebarStyle: string;
  cardStyle: string;
  heroGradient: string;
  pageBackground: string;
  appTheme: string;
}

// Theme definitions - comprehensive themes that affect the whole app
export const APP_THEMES = {
  default: {
    name: "Default",
    description: "Clean and professional",
    sidebar: "default",
    heroGradient: "primary",
    pageBackground: "default",
    topbar: "default",
    cssVars: {}
  },
  ocean: {
    name: "Ocean Blue",
    description: "Calm ocean vibes",
    sidebar: "gradient-ocean",
    heroGradient: "blue-purple",
    pageBackground: "cool-gradient",
    topbar: "ocean",
    cssVars: {
      "--primary": "200 80% 50%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "200 80% 50%",
      "--accent": "200 60% 95%",
      "--accent-foreground": "200 80% 30%",
    }
  },
  sunset: {
    name: "Sunset Glow",
    description: "Warm sunset colors",
    sidebar: "gradient-sunset",
    heroGradient: "rose-orange",
    pageBackground: "warm-gradient",
    topbar: "sunset",
    cssVars: {
      "--primary": "15 85% 55%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "15 85% 55%",
      "--accent": "15 70% 95%",
      "--accent-foreground": "15 85% 35%",
    }
  },
  forest: {
    name: "Forest Green",
    description: "Natural and fresh",
    sidebar: "gradient-forest",
    heroGradient: "green-teal",
    pageBackground: "nature-gradient",
    topbar: "forest",
    cssVars: {
      "--primary": "145 65% 42%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "145 65% 42%",
      "--accent": "145 50% 95%",
      "--accent-foreground": "145 65% 25%",
    }
  },
  midnight: {
    name: "Midnight Purple",
    description: "Elegant and deep",
    sidebar: "gradient-purple",
    heroGradient: "blue-purple",
    pageBackground: "purple-gradient",
    topbar: "purple",
    cssVars: {
      "--primary": "270 70% 55%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "270 70% 55%",
      "--accent": "270 50% 95%",
      "--accent-foreground": "270 70% 35%",
    }
  },
  professional: {
    name: "Professional Dark",
    description: "Sleek and modern",
    sidebar: "gradient-dark",
    heroGradient: "dark-elegant",
    pageBackground: "subtle-gradient",
    topbar: "dark",
    cssVars: {
      "--primary": "220 15% 40%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "220 15% 40%",
      "--accent": "220 10% 95%",
      "--accent-foreground": "220 15% 25%",
    }
  },
  golden: {
    name: "Golden Hour",
    description: "Warm and inviting",
    sidebar: "gradient-sunset",
    heroGradient: "golden",
    pageBackground: "warm-gradient",
    topbar: "golden",
    cssVars: {
      "--primary": "35 90% 50%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "35 90% 50%",
      "--accent": "35 70% 95%",
      "--accent-foreground": "35 90% 30%",
    }
  },
  royal: {
    name: "Royal Blue",
    description: "Classic and trusted",
    sidebar: "gradient-midnight",
    heroGradient: "blue-purple",
    pageBackground: "cool-gradient",
    topbar: "royal",
    cssVars: {
      "--primary": "230 80% 55%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "230 80% 55%",
      "--accent": "230 60% 95%",
      "--accent-foreground": "230 80% 35%",
    }
  },
  cherry: {
    name: "Cherry Blossom",
    description: "Soft and romantic",
    sidebar: "gradient-cherry",
    heroGradient: "cherry-blossom",
    pageBackground: "cherry-gradient",
    topbar: "cherry",
    cssVars: {
      "--primary": "340 75% 55%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "340 75% 55%",
      "--accent": "340 60% 95%",
      "--accent-foreground": "340 75% 35%",
    }
  },
  arctic: {
    name: "Arctic Ice",
    description: "Cool and crisp",
    sidebar: "gradient-arctic",
    heroGradient: "arctic-ice",
    pageBackground: "arctic-frost",
    topbar: "arctic",
    cssVars: {
      "--primary": "195 85% 50%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "195 85% 50%",
      "--accent": "195 60% 95%",
      "--accent-foreground": "195 85% 30%",
    }
  },
  coffee: {
    name: "Coffee Brown",
    description: "Rich and earthy",
    sidebar: "gradient-coffee",
    heroGradient: "coffee-mocha",
    pageBackground: "cream-linen",
    topbar: "coffee",
    cssVars: {
      "--primary": "25 50% 35%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "25 50% 35%",
      "--accent": "25 40% 95%",
      "--accent-foreground": "25 50% 20%",
    }
  },
  lavender: {
    name: "Lavender Dreams",
    description: "Peaceful and calming",
    sidebar: "gradient-lavender",
    heroGradient: "lavender-mist",
    pageBackground: "lavender-dreams",
    topbar: "lavender",
    cssVars: {
      "--primary": "260 50% 60%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "260 50% 60%",
      "--accent": "260 40% 95%",
      "--accent-foreground": "260 50% 35%",
    }
  },
  crimson: {
    name: "Crimson Fire",
    description: "Bold and powerful",
    sidebar: "gradient-crimson",
    heroGradient: "crimson-fire",
    pageBackground: "coral-blush",
    topbar: "crimson",
    cssVars: {
      "--primary": "0 72% 51%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "0 72% 51%",
      "--accent": "0 60% 95%",
      "--accent-foreground": "0 72% 35%",
    }
  },
  mint: {
    name: "Fresh Mint",
    description: "Light and refreshing",
    sidebar: "gradient-mint",
    heroGradient: "mint-fresh",
    pageBackground: "spring-meadow",
    topbar: "mint",
    cssVars: {
      "--primary": "160 60% 45%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "160 60% 45%",
      "--accent": "160 50% 95%",
      "--accent-foreground": "160 60% 25%",
    }
  },
  slate: {
    name: "Slate Modern",
    description: "Minimal and clean",
    sidebar: "gradient-slate",
    heroGradient: "slate-modern",
    pageBackground: "charcoal-silk",
    topbar: "slate",
    cssVars: {
      "--primary": "215 25% 45%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "215 25% 45%",
      "--accent": "215 20% 95%",
      "--accent-foreground": "215 25% 25%",
    }
  },
  coral: {
    name: "Coral Reef",
    description: "Vibrant and lively",
    sidebar: "gradient-coral",
    heroGradient: "coral-reef",
    pageBackground: "peach-cream",
    topbar: "coral",
    cssVars: {
      "--primary": "16 80% 58%",
      "--primary-foreground": "0 0% 100%",
      "--ring": "16 80% 58%",
      "--accent": "16 65% 95%",
      "--accent-foreground": "16 80% 35%",
    }
  },
};

const SIDEBAR_STYLE_CLASSES: Record<string, string> = {
  "default": "bg-sidebar text-sidebar-foreground",
  "gradient-primary": "bg-gradient-to-b from-primary/90 via-primary to-primary/80 text-white",
  "gradient-dark": "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white",
  "gradient-ocean": "bg-gradient-to-b from-blue-600 via-cyan-600 to-teal-600 text-white",
  "gradient-sunset": "bg-gradient-to-b from-orange-500 via-rose-500 to-pink-600 text-white",
  "gradient-forest": "bg-gradient-to-b from-emerald-600 via-green-600 to-teal-700 text-white",
  "gradient-purple": "bg-gradient-to-b from-purple-600 via-violet-600 to-indigo-700 text-white",
  "gradient-midnight": "bg-gradient-to-b from-indigo-900 via-blue-900 to-slate-900 text-white",
  "gradient-cherry": "bg-gradient-to-b from-pink-500 via-rose-500 to-red-500 text-white",
  "gradient-arctic": "bg-gradient-to-b from-cyan-500 via-sky-500 to-blue-500 text-white",
  "gradient-coffee": "bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 text-white",
  "gradient-lavender": "bg-gradient-to-b from-violet-400 via-purple-400 to-fuchsia-500 text-white",
  "gradient-crimson": "bg-gradient-to-b from-red-600 via-rose-600 to-red-700 text-white",
  "gradient-mint": "bg-gradient-to-b from-teal-400 via-emerald-400 to-green-500 text-white",
  "gradient-slate": "bg-gradient-to-b from-slate-600 via-slate-500 to-slate-700 text-white",
  "gradient-coral": "bg-gradient-to-b from-orange-400 via-coral-500 to-pink-500 text-white",
};

const HERO_GRADIENT_CLASSES: Record<string, string> = {
  "primary": "bg-gradient-to-br from-primary/90 via-primary to-primary/80",
  "blue-purple": "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
  "green-teal": "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
  "rose-orange": "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500",
  "dark-elegant": "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
  "golden": "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600",
  "cherry-blossom": "bg-gradient-to-br from-pink-500 via-rose-400 to-pink-600",
  "arctic-ice": "bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600",
  "coffee-mocha": "bg-gradient-to-br from-amber-800 via-amber-700 to-amber-600",
  "lavender-mist": "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500",
  "crimson-fire": "bg-gradient-to-br from-red-600 via-rose-500 to-orange-500",
  "mint-fresh": "bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500",
  "slate-modern": "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800",
  "coral-reef": "bg-gradient-to-br from-orange-500 via-coral-500 to-pink-500",
};

const PAGE_BACKGROUND_CLASSES: Record<string, string> = {
  "default": "bg-background",
  "subtle-gradient": "bg-gradient-to-br from-background via-background to-muted/30",
  // Warm Colors
  "warm-gradient": "bg-gradient-to-br from-background via-orange-50/20 to-rose-50/20 dark:from-background dark:via-orange-950/20 dark:to-rose-950/20",
  "peach-cream": "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-orange-950/40 dark:via-rose-950/40 dark:to-amber-950/40",
  "sunset-glow": "bg-gradient-to-br from-rose-100 via-orange-50 to-yellow-50 dark:from-rose-950/50 dark:via-orange-950/40 dark:to-yellow-950/30",
  "coral-blush": "bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 dark:from-red-950/40 dark:via-pink-950/40 dark:to-rose-950/50",
  // Cool Colors
  "cool-gradient": "bg-gradient-to-br from-background via-blue-50/20 to-cyan-50/20 dark:from-background dark:via-blue-950/20 dark:to-cyan-950/20",
  "ocean-mist": "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/40 dark:via-blue-950/40 dark:to-indigo-950/40",
  "arctic-frost": "bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950/50 dark:via-blue-950/40 dark:to-cyan-950/30",
  "sky-blue": "bg-gradient-to-br from-sky-50 via-blue-100 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/50 dark:to-indigo-950/40",
  // Nature Colors
  "nature-gradient": "bg-gradient-to-br from-background via-green-50/20 to-emerald-50/20 dark:from-background dark:via-green-950/20 dark:to-emerald-950/20",
  "forest-mint": "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40",
  "spring-meadow": "bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 dark:from-lime-950/30 dark:via-green-950/40 dark:to-emerald-950/40",
  "sage-mist": "bg-gradient-to-br from-green-50 via-stone-50 to-emerald-50 dark:from-green-950/40 dark:via-stone-950/40 dark:to-emerald-950/40",
  // Purple & Violet
  "purple-gradient": "bg-gradient-to-br from-background via-purple-50/20 to-indigo-50/20 dark:from-background dark:via-purple-950/20 dark:to-indigo-950/20",
  "lavender-dreams": "bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-950/40 dark:via-violet-950/40 dark:to-fuchsia-950/40",
  "twilight-purple": "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40",
  "grape-fizz": "bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 dark:from-violet-950/50 dark:via-purple-950/40 dark:to-indigo-950/50",
  // Neutral & Elegant
  "pearl-white": "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/30 dark:via-gray-950/30 dark:to-zinc-950/30",
  "charcoal-silk": "bg-gradient-to-br from-zinc-100 via-slate-50 to-neutral-100 dark:from-zinc-900/60 dark:via-slate-900/50 dark:to-neutral-900/60",
  "cream-linen": "bg-gradient-to-br from-amber-50/80 via-stone-50 to-orange-50/60 dark:from-amber-950/30 dark:via-stone-950/30 dark:to-orange-950/20",
  // Patterns
  "dotted-pattern": "bg-background bg-[radial-gradient(circle,_hsl(var(--muted))_1px,_transparent_1px)] bg-[size:20px_20px]",
  "grid-pattern": "bg-background bg-[linear-gradient(hsl(var(--muted)/0.3)_1px,_transparent_1px),_linear-gradient(90deg,_hsl(var(--muted)/0.3)_1px,_transparent_1px)] bg-[size:40px_40px]",
  "diamond-pattern": "bg-background bg-[linear-gradient(45deg,_hsl(var(--muted)/0.15)_25%,_transparent_25%,_transparent_75%,_hsl(var(--muted)/0.15)_75%)] bg-[size:30px_30px]",
};

const TOPBAR_CLASSES: Record<string, string> = {
  "default": "bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60 border-border/30",
  "ocean": "bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 backdrop-blur-lg border-blue-200/30 dark:border-blue-800/30",
  "sunset": "bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 backdrop-blur-lg border-orange-200/30 dark:border-orange-800/30",
  "forest": "bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 backdrop-blur-lg border-emerald-200/30 dark:border-emerald-800/30",
  "purple": "bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 backdrop-blur-lg border-purple-200/30 dark:border-purple-800/30",
  "dark": "bg-gradient-to-r from-slate-800/20 via-slate-700/20 to-slate-800/20 backdrop-blur-lg border-slate-700/30",
  "golden": "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-lg border-amber-200/30 dark:border-amber-800/30",
  "royal": "bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-lg border-indigo-200/30 dark:border-indigo-800/30",
  "cherry": "bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10 backdrop-blur-lg border-pink-200/30 dark:border-pink-800/30",
  "arctic": "bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-500/10 backdrop-blur-lg border-cyan-200/30 dark:border-cyan-800/30",
  "coffee": "bg-gradient-to-r from-amber-800/10 via-amber-700/10 to-amber-600/10 backdrop-blur-lg border-amber-300/30 dark:border-amber-700/30",
  "lavender": "bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-lg border-violet-200/30 dark:border-violet-800/30",
  "crimson": "bg-gradient-to-r from-red-500/10 via-rose-500/10 to-orange-500/10 backdrop-blur-lg border-red-200/30 dark:border-red-800/30",
  "mint": "bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-green-500/10 backdrop-blur-lg border-teal-200/30 dark:border-teal-800/30",
  "slate": "bg-gradient-to-r from-slate-500/10 via-slate-600/10 to-slate-500/10 backdrop-blur-lg border-slate-300/30 dark:border-slate-700/30",
  "coral": "bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-rose-500/10 backdrop-blur-lg border-orange-200/30 dark:border-orange-800/30",
};

const BOTTOM_NAV_CLASSES: Record<string, string> = {
  "default": "bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60 border-border/30",
  "ocean": "bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 backdrop-blur-lg border-blue-200/30 dark:border-blue-800/30",
  "sunset": "bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 backdrop-blur-lg border-orange-200/30 dark:border-orange-800/30",
  "forest": "bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 backdrop-blur-lg border-emerald-200/30 dark:border-emerald-800/30",
  "purple": "bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 backdrop-blur-lg border-purple-200/30 dark:border-purple-800/30",
  "dark": "bg-gradient-to-r from-slate-800/20 via-slate-700/20 to-slate-800/20 backdrop-blur-lg border-slate-700/30",
  "golden": "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-lg border-amber-200/30 dark:border-amber-800/30",
  "royal": "bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-lg border-indigo-200/30 dark:border-indigo-800/30",
  "cherry": "bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10 backdrop-blur-lg border-pink-200/30 dark:border-pink-800/30",
  "arctic": "bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-500/10 backdrop-blur-lg border-cyan-200/30 dark:border-cyan-800/30",
  "coffee": "bg-gradient-to-r from-amber-800/10 via-amber-700/10 to-amber-600/10 backdrop-blur-lg border-amber-300/30 dark:border-amber-700/30",
  "lavender": "bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-lg border-violet-200/30 dark:border-violet-800/30",
  "crimson": "bg-gradient-to-r from-red-500/10 via-rose-500/10 to-orange-500/10 backdrop-blur-lg border-red-200/30 dark:border-red-800/30",
  "mint": "bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-green-500/10 backdrop-blur-lg border-teal-200/30 dark:border-teal-800/30",
  "slate": "bg-gradient-to-r from-slate-500/10 via-slate-600/10 to-slate-500/10 backdrop-blur-lg border-slate-300/30 dark:border-slate-700/30",
  "coral": "bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-rose-500/10 backdrop-blur-lg border-orange-200/30 dark:border-orange-800/30",
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
    appTheme: "default",
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
        .select("sidebar_style, card_style, hero_gradient, page_background, app_theme")
        .limit(1)
        .single();

      if (error) throw error;

      const fetchedStyles: UIStyles = {
        sidebarStyle: (data as any)?.sidebar_style || "default",
        cardStyle: (data as any)?.card_style || "default",
        heroGradient: (data as any)?.hero_gradient || "primary",
        pageBackground: (data as any)?.page_background || "default",
        appTheme: (data as any)?.app_theme || "default",
      };

      // Apply theme CSS variables if a theme is selected
      applyThemeCssVars(fetchedStyles.appTheme);

      stylesCache = fetchedStyles;
      stylesCacheLoaded = true;
      setStyles(fetchedStyles);
    } catch (error) {
      console.error("Error fetching UI styles:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeCssVars = (themeId: string) => {
    const theme = APP_THEMES[themeId as keyof typeof APP_THEMES];
    if (theme && theme.cssVars) {
      const root = document.documentElement;
      Object.entries(theme.cssVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  };

  const getSidebarClass = () => {
    // Always use the saved sidebar style (allows customization per theme)
    return SIDEBAR_STYLE_CLASSES[styles.sidebarStyle] || SIDEBAR_STYLE_CLASSES["default"];
  };

  const getHeroGradientClass = () => {
    // If using a theme, get hero gradient from theme
    if (styles.appTheme && styles.appTheme !== "default") {
      const theme = APP_THEMES[styles.appTheme as keyof typeof APP_THEMES];
      if (theme) {
        return HERO_GRADIENT_CLASSES[theme.heroGradient] || HERO_GRADIENT_CLASSES["primary"];
      }
    }
    return HERO_GRADIENT_CLASSES[styles.heroGradient] || HERO_GRADIENT_CLASSES["primary"];
  };

  const getPageBackgroundClass = () => {
    // Always use the saved page background (allows customization per theme)
    return PAGE_BACKGROUND_CLASSES[styles.pageBackground] || PAGE_BACKGROUND_CLASSES["default"];
  };

  const isGradientSidebar = () => {
    if (styles.appTheme && styles.appTheme !== "default") {
      const theme = APP_THEMES[styles.appTheme as keyof typeof APP_THEMES];
      if (theme) {
        return theme.sidebar !== "default";
      }
    }
    return styles.sidebarStyle !== "default";
  };

  const getTopbarClass = () => {
    if (styles.appTheme && styles.appTheme !== "default") {
      const theme = APP_THEMES[styles.appTheme as keyof typeof APP_THEMES];
      if (theme && theme.topbar) {
        return TOPBAR_CLASSES[theme.topbar] || TOPBAR_CLASSES["default"];
      }
    }
    return TOPBAR_CLASSES["default"];
  };

  const getBottomNavClass = () => {
    if (styles.appTheme && styles.appTheme !== "default") {
      const theme = APP_THEMES[styles.appTheme as keyof typeof APP_THEMES];
      if (theme && theme.topbar) {
        return BOTTOM_NAV_CLASSES[theme.topbar] || BOTTOM_NAV_CLASSES["default"];
      }
    }
    return BOTTOM_NAV_CLASSES["default"];
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
    getTopbarClass,
    getBottomNavClass,
    refreshStyles,
    SIDEBAR_STYLE_CLASSES,
    HERO_GRADIENT_CLASSES,
    PAGE_BACKGROUND_CLASSES,
    TOPBAR_CLASSES,
    BOTTOM_NAV_CLASSES,
    APP_THEMES,
  };
}

// Export for use in components that need direct access
export { SIDEBAR_STYLE_CLASSES, HERO_GRADIENT_CLASSES, PAGE_BACKGROUND_CLASSES, TOPBAR_CLASSES, BOTTOM_NAV_CLASSES };
