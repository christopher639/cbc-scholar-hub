import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { APP_THEMES } from "@/hooks/useUIStyles";

interface ThemeSettings {
  app_theme: string;
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
};

export function ThemeSettingsCard() {
  const [settings, setSettings] = useState<ThemeSettings>({
    app_theme: "default"
  });
  const [originalSettings, setOriginalSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("appearance_settings")
        .select("app_theme")
        .limit(1)
        .single();

      if (error) throw error;
      
      const fetchedSettings = {
        app_theme: (data as any)?.app_theme || "default"
      };
      
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
    } catch (error: any) {
      console.error("Error fetching theme settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("appearance_settings")
        .update({
          app_theme: settings.app_theme
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

  const hasChanges = originalSettings && settings.app_theme !== originalSettings.app_theme;

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Application Theme
        </CardTitle>
        <CardDescription>
          Choose a theme that transforms the entire application - sidebar, topbar, buttons, dialogs, and pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(APP_THEMES).map(([id, theme]) => {
            const preview = THEME_PREVIEWS[id] || THEME_PREVIEWS.default;
            return (
              <button
                key={id}
                onClick={() => setSettings({ app_theme: id })}
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
    </Card>
  );
}
