import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Palette, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { APP_THEMES, SIDEBAR_STYLE_CLASSES, PAGE_BACKGROUND_CLASSES } from "@/hooks/useUIStyles";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ThemeSettings {
  app_theme: string;
  sidebar_style: string;
  page_background: string;
}

const THEME_PREVIEWS: Record<string, { sidebar: string; page: string; hero: string; topbar: string }> = {
  default: {
    sidebar: "bg-sidebar",
    page: "bg-background",
    hero: "bg-gradient-to-br from-primary/90 via-primary to-primary/80",
    topbar: "bg-card/70"
  },
  ocean: {
    sidebar: "bg-gradient-to-b from-blue-600 via-cyan-600 to-teal-600",
    page: "bg-gradient-to-br from-background via-blue-50/20 to-cyan-50/20",
    hero: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
    topbar: "bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20"
  },
  sunset: {
    sidebar: "bg-gradient-to-b from-orange-500 via-rose-500 to-pink-600",
    page: "bg-gradient-to-br from-background via-orange-50/20 to-rose-50/20",
    hero: "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500",
    topbar: "bg-gradient-to-r from-orange-500/20 via-rose-500/20 to-pink-500/20"
  },
  forest: {
    sidebar: "bg-gradient-to-b from-emerald-600 via-green-600 to-teal-700",
    page: "bg-gradient-to-br from-background via-green-50/20 to-emerald-50/20",
    hero: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
    topbar: "bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20"
  },
  midnight: {
    sidebar: "bg-gradient-to-b from-purple-600 via-violet-600 to-indigo-700",
    page: "bg-gradient-to-br from-background via-purple-50/20 to-indigo-50/20",
    hero: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
    topbar: "bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-indigo-500/20"
  },
  professional: {
    sidebar: "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900",
    page: "bg-gradient-to-br from-background via-background to-muted/50",
    hero: "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
    topbar: "bg-gradient-to-r from-slate-800/30 via-slate-700/30 to-slate-800/30"
  },
  golden: {
    sidebar: "bg-gradient-to-b from-orange-500 via-rose-500 to-pink-600",
    page: "bg-gradient-to-br from-background via-orange-50/20 to-rose-50/20",
    hero: "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600",
    topbar: "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20"
  },
  royal: {
    sidebar: "bg-gradient-to-b from-indigo-900 via-blue-900 to-slate-900",
    page: "bg-gradient-to-br from-background via-blue-50/20 to-cyan-50/20",
    hero: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
    topbar: "bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-indigo-500/20"
  },
  cherry: {
    sidebar: "bg-gradient-to-b from-pink-500 via-rose-500 to-red-500",
    page: "bg-gradient-to-br from-background via-pink-50/20 to-rose-50/20",
    hero: "bg-gradient-to-br from-pink-500 via-rose-400 to-pink-600",
    topbar: "bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-red-500/20"
  },
  arctic: {
    sidebar: "bg-gradient-to-b from-cyan-500 via-sky-500 to-blue-500",
    page: "bg-gradient-to-br from-background via-cyan-50/20 to-sky-50/20",
    hero: "bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600",
    topbar: "bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-blue-500/20"
  },
  coffee: {
    sidebar: "bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900",
    page: "bg-gradient-to-br from-background via-amber-50/20 to-orange-50/20",
    hero: "bg-gradient-to-br from-amber-800 via-amber-700 to-amber-600",
    topbar: "bg-gradient-to-r from-amber-700/20 via-amber-600/20 to-amber-700/20"
  },
  lavender: {
    sidebar: "bg-gradient-to-b from-violet-400 via-purple-400 to-fuchsia-500",
    page: "bg-gradient-to-br from-background via-violet-50/20 to-purple-50/20",
    hero: "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500",
    topbar: "bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20"
  },
  crimson: {
    sidebar: "bg-gradient-to-b from-red-600 via-rose-600 to-red-700",
    page: "bg-gradient-to-br from-background via-red-50/20 to-rose-50/20",
    hero: "bg-gradient-to-br from-red-600 via-rose-500 to-orange-500",
    topbar: "bg-gradient-to-r from-red-500/20 via-rose-500/20 to-orange-500/20"
  },
  mint: {
    sidebar: "bg-gradient-to-b from-teal-400 via-emerald-400 to-green-500",
    page: "bg-gradient-to-br from-background via-teal-50/20 to-emerald-50/20",
    hero: "bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500",
    topbar: "bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-green-500/20"
  },
  slate: {
    sidebar: "bg-gradient-to-b from-slate-600 via-slate-500 to-slate-700",
    page: "bg-gradient-to-br from-background via-slate-50/20 to-gray-50/20",
    hero: "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800",
    topbar: "bg-gradient-to-r from-slate-500/20 via-slate-600/20 to-slate-500/20"
  },
  coral: {
    sidebar: "bg-gradient-to-b from-orange-400 via-rose-400 to-pink-500",
    page: "bg-gradient-to-br from-background via-orange-50/20 to-pink-50/20",
    hero: "bg-gradient-to-br from-orange-500 via-rose-400 to-pink-500",
    topbar: "bg-gradient-to-r from-orange-500/20 via-rose-500/20 to-pink-500/20"
  },
};

// Sidebar style options with display names
const SIDEBAR_OPTIONS = [
  { id: "default", name: "Default", preview: "bg-sidebar" },
  { id: "gradient-primary", name: "Primary Gradient", preview: "bg-gradient-to-b from-primary/90 to-primary/80" },
  { id: "gradient-dark", name: "Dark", preview: "bg-gradient-to-b from-slate-900 to-slate-800" },
  { id: "gradient-ocean", name: "Ocean", preview: "bg-gradient-to-b from-blue-600 to-teal-600" },
  { id: "gradient-sunset", name: "Sunset", preview: "bg-gradient-to-b from-orange-500 to-pink-600" },
  { id: "gradient-forest", name: "Forest", preview: "bg-gradient-to-b from-emerald-600 to-teal-700" },
  { id: "gradient-purple", name: "Purple", preview: "bg-gradient-to-b from-purple-600 to-indigo-700" },
  { id: "gradient-midnight", name: "Midnight", preview: "bg-gradient-to-b from-indigo-900 to-slate-900" },
  { id: "gradient-cherry", name: "Cherry", preview: "bg-gradient-to-b from-pink-500 to-red-500" },
  { id: "gradient-arctic", name: "Arctic", preview: "bg-gradient-to-b from-cyan-500 to-blue-500" },
  { id: "gradient-coffee", name: "Coffee", preview: "bg-gradient-to-b from-amber-800 to-amber-900" },
  { id: "gradient-lavender", name: "Lavender", preview: "bg-gradient-to-b from-violet-400 to-fuchsia-500" },
  { id: "gradient-crimson", name: "Crimson", preview: "bg-gradient-to-b from-red-600 to-red-700" },
  { id: "gradient-mint", name: "Mint", preview: "bg-gradient-to-b from-teal-400 to-green-500" },
  { id: "gradient-slate", name: "Slate", preview: "bg-gradient-to-b from-slate-600 to-slate-700" },
  { id: "gradient-coral", name: "Coral", preview: "bg-gradient-to-b from-orange-400 to-pink-500" },
];

// Background options with display names
const BACKGROUND_OPTIONS = [
  { id: "default", name: "Default", preview: "bg-background" },
  { id: "subtle-gradient", name: "Subtle", preview: "bg-gradient-to-br from-background to-muted/30" },
  { id: "warm-gradient", name: "Warm", preview: "bg-gradient-to-br from-background via-orange-50/30 to-rose-50/30" },
  { id: "peach-cream", name: "Peach Cream", preview: "bg-gradient-to-br from-orange-50 to-rose-50" },
  { id: "sunset-glow", name: "Sunset Glow", preview: "bg-gradient-to-br from-rose-100 to-yellow-50" },
  { id: "coral-blush", name: "Coral Blush", preview: "bg-gradient-to-br from-red-50 to-rose-100" },
  { id: "cool-gradient", name: "Cool", preview: "bg-gradient-to-br from-background via-blue-50/30 to-cyan-50/30" },
  { id: "ocean-mist", name: "Ocean Mist", preview: "bg-gradient-to-br from-cyan-50 to-indigo-50" },
  { id: "arctic-frost", name: "Arctic Frost", preview: "bg-gradient-to-br from-slate-50 to-cyan-50" },
  { id: "sky-blue", name: "Sky Blue", preview: "bg-gradient-to-br from-sky-50 to-indigo-50" },
  { id: "nature-gradient", name: "Nature", preview: "bg-gradient-to-br from-background via-green-50/30 to-emerald-50/30" },
  { id: "forest-mint", name: "Forest Mint", preview: "bg-gradient-to-br from-emerald-50 to-teal-50" },
  { id: "spring-meadow", name: "Spring Meadow", preview: "bg-gradient-to-br from-lime-50 to-emerald-50" },
  { id: "sage-mist", name: "Sage Mist", preview: "bg-gradient-to-br from-green-50 to-emerald-50" },
  { id: "purple-gradient", name: "Purple", preview: "bg-gradient-to-br from-background via-purple-50/30 to-indigo-50/30" },
  { id: "lavender-dreams", name: "Lavender Dreams", preview: "bg-gradient-to-br from-purple-50 to-fuchsia-50" },
  { id: "twilight-purple", name: "Twilight", preview: "bg-gradient-to-br from-indigo-50 to-pink-50" },
  { id: "grape-fizz", name: "Grape Fizz", preview: "bg-gradient-to-br from-violet-100 to-indigo-100" },
  { id: "pearl-white", name: "Pearl White", preview: "bg-gradient-to-br from-slate-50 to-zinc-50" },
  { id: "charcoal-silk", name: "Charcoal Silk", preview: "bg-gradient-to-br from-zinc-100 to-neutral-100" },
  { id: "cream-linen", name: "Cream Linen", preview: "bg-gradient-to-br from-amber-50/80 to-orange-50/60" },
];

export function ThemeSettingsCard() {
  const [settings, setSettings] = useState<ThemeSettings>({
    app_theme: "default",
    sidebar_style: "default",
    page_background: "default"
  });
  const [originalSettings, setOriginalSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("appearance_settings")
        .select("app_theme, sidebar_style, page_background")
        .limit(1)
        .single();

      if (error) throw error;
      
      const fetchedSettings = {
        app_theme: (data as any)?.app_theme || "default",
        sidebar_style: (data as any)?.sidebar_style || "default",
        page_background: (data as any)?.page_background || "default"
      };
      
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
    } catch (error: any) {
      console.error("Error fetching theme settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    // When selecting a theme, update sidebar and background to match the theme defaults
    const theme = APP_THEMES[themeId as keyof typeof APP_THEMES];
    if (theme) {
      setSettings({
        app_theme: themeId,
        sidebar_style: theme.sidebar,
        page_background: theme.pageBackground
      });
    } else {
      setSettings(prev => ({ ...prev, app_theme: themeId }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("appearance_settings")
        .update({
          app_theme: settings.app_theme,
          sidebar_style: settings.sidebar_style,
          page_background: settings.page_background
        } as any)
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
      
      setOriginalSettings(settings);
      
      // Force page reload to apply new theme
      window.location.reload();
      
      toast({
        title: "Success",
        description: "Theme applied. Reloading to apply changes...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const hasChanges = originalSettings && (
    settings.app_theme !== originalSettings.app_theme ||
    settings.sidebar_style !== originalSettings.sidebar_style ||
    settings.page_background !== originalSettings.page_background
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">Application Theme</CardTitle>
                  <CardDescription className="text-sm">
                    {isExpanded ? "Choose a theme that transforms the entire application" : `Current: ${APP_THEMES[settings.app_theme as keyof typeof APP_THEMES]?.name || "Default"}`}
                  </CardDescription>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Theme Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(APP_THEMES).map(([id, theme]) => {
            const preview = THEME_PREVIEWS[id] || THEME_PREVIEWS.default;
            return (
              <button
                key={id}
                onClick={() => handleThemeSelect(id)}
                className={cn(
                  "relative flex flex-col rounded-xl border-2 transition-all hover:scale-[1.02] overflow-hidden",
                  settings.app_theme === id
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                {/* Theme Preview */}
                <div className="flex h-24 overflow-hidden">
                  {/* Sidebar Preview */}
                  <div className={cn("w-8 h-full relative", preview.sidebar)}>
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="p-1 space-y-1">
                      <div className="h-1 w-4 bg-white/30 rounded" />
                      <div className="h-1 w-3 bg-white/20 rounded" />
                      <div className="h-1 w-5 bg-white/20 rounded" />
                    </div>
                  </div>
                  {/* Main Content Preview */}
                  <div className={cn("flex-1 flex flex-col", preview.page)}>
                    {/* Topbar */}
                    <div className={cn("h-4 border-b border-border/30 flex items-center px-1", preview.topbar)}>
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                      <div className="ml-auto flex gap-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                      </div>
                    </div>
                    {/* Hero */}
                    <div className={cn("h-10 relative overflow-hidden", preview.hero)}>
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="p-1.5 flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-white/30 ring-1 ring-white/20" />
                        <div className="space-y-0.5">
                          <div className="h-1 w-8 bg-white/40 rounded" />
                          <div className="h-0.5 w-5 bg-white/25 rounded" />
                        </div>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-1">
                      <div className="h-4 w-full rounded bg-card border border-border/30" />
                    </div>
                  </div>
                </div>
                
                {/* Theme Info */}
                <div className="p-3 bg-card border-t border-border/50">
                  <p className="text-sm font-medium">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </div>
                
                {settings.app_theme === id && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Customize Section */}
        <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Customize Theme Colors
              </span>
              {customizeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-6">
            {/* Sidebar Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sidebar Color</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {SIDEBAR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSettings(prev => ({ ...prev, sidebar_style: option.id }))}
                    className={cn(
                      "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                      settings.sidebar_style === option.id
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div className={cn("h-10 w-full rounded-md", option.preview)} />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{option.name}</span>
                    {settings.sidebar_style === option.id && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Background */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Page Background</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSettings(prev => ({ ...prev, page_background: option.id }))}
                    className={cn(
                      "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                      settings.page_background === option.id
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div className={cn("h-8 w-full rounded-md border border-border/50", option.preview)} />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{option.name}</span>
                    {settings.page_background === option.id && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !hasChanges} className="min-w-[120px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply Theme"
            )}
          </Button>
        </div>
      </CardContent>
    </CollapsibleContent>
  </Card>
</Collapsible>
  );
}