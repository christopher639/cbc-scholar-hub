import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Layout, Layers, Sparkles, Monitor, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UIStyleSettings {
  sidebar_style: string;
  card_style: string;
  hero_gradient: string;
  page_background: string;
}

const CARD_STYLES = [
  { id: "default", name: "Default", description: "Standard card", borderClass: "border", shadowClass: "shadow-sm" },
  { id: "elevated", name: "Elevated", description: "More shadow", borderClass: "border", shadowClass: "shadow-lg" },
  { id: "glass", name: "Glass", description: "Frosted glass", borderClass: "border border-white/20", shadowClass: "backdrop-blur-sm bg-card/80" },
  { id: "minimal", name: "Minimal", description: "No border", borderClass: "border-0", shadowClass: "shadow-none" },
  { id: "rounded", name: "Rounded", description: "Extra rounded", borderClass: "border rounded-2xl", shadowClass: "shadow-md" },
];

const HERO_GRADIENTS = [
  { id: "primary", name: "Primary", description: "Primary color", preview: "bg-gradient-to-br from-primary/90 via-primary to-primary/80" },
  { id: "blue-purple", name: "Blue Purple", description: "Cool tones", preview: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" },
  { id: "green-teal", name: "Green Teal", description: "Fresh green", preview: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" },
  { id: "rose-orange", name: "Rose Orange", description: "Warm rose", preview: "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500" },
  { id: "dark-elegant", name: "Dark", description: "Sophisticated", preview: "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" },
  { id: "golden", name: "Golden", description: "Warm gold", preview: "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600" },
];

// Validate hex color code
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

export function UIStyleSettingsCard() {
  const [settings, setSettings] = useState<UIStyleSettings>({
    sidebar_style: "#1e3a5f",
    card_style: "default",
    hero_gradient: "primary",
    page_background: "#f8fafc"
  });
  const [originalSettings, setOriginalSettings] = useState<UIStyleSettings | null>(null);
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
        .select("sidebar_style, card_style, hero_gradient, page_background")
        .limit(1)
        .single();

      if (error) throw error;
      
      const fetchedSettings = {
        sidebar_style: (data as any)?.sidebar_style || "#1e3a5f",
        card_style: (data as any)?.card_style || "default",
        hero_gradient: (data as any)?.hero_gradient || "primary",
        page_background: (data as any)?.page_background || "#f8fafc"
      };
      
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
    } catch (error: any) {
      console.error("Error fetching UI style settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate color codes
    if (!isValidHexColor(settings.sidebar_style)) {
      toast({
        title: "Invalid Sidebar Color",
        description: "Please enter a valid hex color code (e.g., #1e3a5f)",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidHexColor(settings.page_background)) {
      toast({
        title: "Invalid Page Background Color",
        description: "Please enter a valid hex color code (e.g., #f8fafc)",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("appearance_settings")
        .update({
          sidebar_style: settings.sidebar_style,
          card_style: settings.card_style,
          hero_gradient: settings.hero_gradient,
          page_background: settings.page_background
        } as any)
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
      
      setOriginalSettings(settings);
      
      // Force page reload to apply new styles
      window.location.reload();
      
      toast({
        title: "Success",
        description: "UI style settings saved. Reloading to apply changes...",
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
    settings.sidebar_style !== originalSettings.sidebar_style ||
    settings.card_style !== originalSettings.card_style ||
    settings.hero_gradient !== originalSettings.hero_gradient ||
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          UI Style Settings
        </CardTitle>
        <CardDescription>
          Customize sidebars, cards, hero sections, and page backgrounds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Sidebar Color */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Sidebar Color</Label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg border-2 border-border shadow-sm cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: isValidHexColor(settings.sidebar_style) ? settings.sidebar_style : '#1e3a5f' }}
              >
                <input
                  type="color"
                  value={isValidHexColor(settings.sidebar_style) ? settings.sidebar_style : '#1e3a5f'}
                  onChange={(e) => setSettings({ ...settings, sidebar_style: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  type="text"
                  value={settings.sidebar_style}
                  onChange={(e) => setSettings({ ...settings, sidebar_style: e.target.value })}
                  placeholder="#1e3a5f"
                  className={cn(
                    "w-32 font-mono text-sm",
                    !isValidHexColor(settings.sidebar_style) && settings.sidebar_style !== "" && "border-destructive"
                  )}
                />
                <span className="text-xs text-muted-foreground">Hex color code</span>
              </div>
            </div>
            <div 
              className="flex-1 h-12 rounded-lg border border-border/50 relative overflow-hidden"
              style={{ backgroundColor: isValidHexColor(settings.sidebar_style) ? settings.sidebar_style : '#1e3a5f' }}
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-6 h-6 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Page Background Color */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Page Background Color</Label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg border-2 border-border shadow-sm cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: isValidHexColor(settings.page_background) ? settings.page_background : '#f8fafc' }}
              >
                <input
                  type="color"
                  value={isValidHexColor(settings.page_background) ? settings.page_background : '#f8fafc'}
                  onChange={(e) => setSettings({ ...settings, page_background: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  type="text"
                  value={settings.page_background}
                  onChange={(e) => setSettings({ ...settings, page_background: e.target.value })}
                  placeholder="#f8fafc"
                  className={cn(
                    "w-32 font-mono text-sm",
                    !isValidHexColor(settings.page_background) && settings.page_background !== "" && "border-destructive"
                  )}
                />
                <span className="text-xs text-muted-foreground">Hex color code</span>
              </div>
            </div>
            <div 
              className="flex-1 h-12 rounded-lg border border-border/50"
              style={{ backgroundColor: isValidHexColor(settings.page_background) ? settings.page_background : '#f8fafc' }}
            >
              <span className="h-full flex items-center justify-center text-muted-foreground text-xs font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Hero/Profile Gradient */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Hero & Profile Gradient</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {HERO_GRADIENTS.map((gradient) => (
              <button
                key={gradient.id}
                onClick={() => setSettings({ ...settings, hero_gradient: gradient.id })}
                className={cn(
                  "relative flex flex-col items-center p-2.5 rounded-xl border-2 transition-all hover:scale-[1.02]",
                  settings.hero_gradient === gradient.id
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className={cn("w-full h-12 rounded-lg mb-2 relative overflow-hidden", gradient.preview)}>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-6 h-6 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                  </div>
                </div>
                <span className="text-xs font-medium">{gradient.name}</span>
                {settings.hero_gradient === gradient.id && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Card Style</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CARD_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSettings({ ...settings, card_style: style.id })}
                className={cn(
                  "relative flex flex-col items-center p-2.5 rounded-xl border-2 transition-all hover:scale-[1.02]",
                  settings.card_style === style.id
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className={cn(
                  "w-full h-10 rounded-lg mb-2 bg-card",
                  style.borderClass,
                  style.shadowClass
                )}>
                  <div className="h-2 w-3/4 bg-muted rounded m-2" />
                  <div className="h-1.5 w-1/2 bg-muted/60 rounded mx-2" />
                </div>
                <span className="text-xs font-medium">{style.name}</span>
                {settings.card_style === style.id && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
