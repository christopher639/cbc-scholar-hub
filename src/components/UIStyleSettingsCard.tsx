import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Layout, Layers, Sparkles, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UIStyleSettings {
  sidebar_style: string;
  card_style: string;
  hero_gradient: string;
  page_background: string;
}

const SIDEBAR_STYLES = [
  { id: "default", name: "Default", description: "Clean minimal", preview: "bg-sidebar" },
  { id: "gradient-primary", name: "Primary", description: "Primary color", preview: "bg-gradient-to-b from-primary/90 via-primary to-primary/80" },
  { id: "gradient-dark", name: "Dark", description: "Sleek dark", preview: "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" },
  { id: "gradient-ocean", name: "Ocean", description: "Blue ocean", preview: "bg-gradient-to-b from-blue-600 via-cyan-600 to-teal-600" },
  { id: "gradient-sunset", name: "Sunset", description: "Warm colors", preview: "bg-gradient-to-b from-orange-500 via-rose-500 to-pink-600" },
  { id: "gradient-forest", name: "Forest", description: "Nature green", preview: "bg-gradient-to-b from-emerald-600 via-green-600 to-teal-700" },
  { id: "gradient-purple", name: "Purple", description: "Rich purple", preview: "bg-gradient-to-b from-purple-600 via-violet-600 to-indigo-700" },
  { id: "gradient-midnight", name: "Midnight", description: "Deep blue", preview: "bg-gradient-to-b from-indigo-900 via-blue-900 to-slate-900" },
  { id: "gradient-coral", name: "Coral", description: "Warm coral", preview: "bg-gradient-to-b from-orange-400 via-red-400 to-pink-500" },
  { id: "gradient-rose", name: "Rose", description: "Soft rose", preview: "bg-gradient-to-b from-rose-500 via-pink-500 to-fuchsia-500" },
  { id: "gradient-amber", name: "Amber", description: "Golden amber", preview: "bg-gradient-to-b from-amber-500 via-yellow-500 to-orange-400" },
  { id: "gradient-teal", name: "Teal", description: "Deep teal", preview: "bg-gradient-to-b from-teal-600 via-cyan-600 to-emerald-600" },
  { id: "gradient-crimson", name: "Crimson", description: "Bold red", preview: "bg-gradient-to-b from-red-600 via-rose-600 to-pink-600" },
  { id: "gradient-sky", name: "Sky", description: "Light blue", preview: "bg-gradient-to-b from-sky-500 via-blue-500 to-indigo-500" },
  { id: "gradient-lime", name: "Lime", description: "Fresh lime", preview: "bg-gradient-to-b from-lime-500 via-green-500 to-emerald-500" },
  { id: "gradient-fuchsia", name: "Fuchsia", description: "Vibrant pink", preview: "bg-gradient-to-b from-fuchsia-600 via-pink-600 to-rose-600" },
];

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

const PAGE_BACKGROUNDS = [
  // Basic
  { id: "default", name: "Default", description: "Solid background", preview: "bg-background", category: "basic" },
  { id: "subtle-gradient", name: "Subtle", description: "Gentle gradient", preview: "bg-gradient-to-br from-background via-background to-muted/50", category: "basic" },
  // Warm Colors
  { id: "warm-gradient", name: "Warm", description: "Warm tones", preview: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", category: "warm" },
  { id: "peach-cream", name: "Peach", description: "Peach cream", preview: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", category: "warm" },
  { id: "sunset-glow", name: "Sunset", description: "Sunset glow", preview: "bg-gradient-to-br from-rose-100 via-orange-50 to-yellow-50", category: "warm" },
  { id: "coral-blush", name: "Coral", description: "Coral blush", preview: "bg-gradient-to-br from-red-50 via-pink-50 to-rose-100", category: "warm" },
  // Cool Colors
  { id: "cool-gradient", name: "Cool", description: "Cool blues", preview: "bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50", category: "cool" },
  { id: "ocean-mist", name: "Ocean", description: "Ocean mist", preview: "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50", category: "cool" },
  { id: "arctic-frost", name: "Arctic", description: "Arctic frost", preview: "bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50", category: "cool" },
  { id: "sky-blue", name: "Sky", description: "Sky blue", preview: "bg-gradient-to-br from-sky-50 via-blue-100 to-indigo-50", category: "cool" },
  // Nature Colors
  { id: "nature-gradient", name: "Nature", description: "Green tones", preview: "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50", category: "nature" },
  { id: "forest-mint", name: "Forest", description: "Forest mint", preview: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50", category: "nature" },
  { id: "spring-meadow", name: "Spring", description: "Spring meadow", preview: "bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50", category: "nature" },
  { id: "sage-mist", name: "Sage", description: "Sage mist", preview: "bg-gradient-to-br from-green-50 via-stone-50 to-emerald-50", category: "nature" },
  // Purple & Violet
  { id: "purple-gradient", name: "Purple", description: "Purple tones", preview: "bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50", category: "purple" },
  { id: "lavender-dreams", name: "Lavender", description: "Lavender dreams", preview: "bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50", category: "purple" },
  { id: "twilight-purple", name: "Twilight", description: "Twilight purple", preview: "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50", category: "purple" },
  { id: "grape-fizz", name: "Grape", description: "Grape fizz", preview: "bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100", category: "purple" },
  // Neutral & Elegant
  { id: "pearl-white", name: "Pearl", description: "Pearl white", preview: "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50", category: "neutral" },
  { id: "charcoal-silk", name: "Charcoal", description: "Charcoal silk", preview: "bg-gradient-to-br from-zinc-100 via-slate-50 to-neutral-100", category: "neutral" },
  { id: "cream-linen", name: "Cream", description: "Cream linen", preview: "bg-gradient-to-br from-amber-50/80 via-stone-50 to-orange-50/60", category: "neutral" },
  // Patterns
  { id: "dotted-pattern", name: "Dotted", description: "Dot pattern", preview: "bg-muted/30", category: "pattern" },
  { id: "grid-pattern", name: "Grid", description: "Grid lines", preview: "bg-muted/20", category: "pattern" },
  { id: "diamond-pattern", name: "Diamond", description: "Diamond pattern", preview: "bg-muted/25", category: "pattern" },
];

export function UIStyleSettingsCard() {
  const [settings, setSettings] = useState<UIStyleSettings>({
    sidebar_style: "default",
    card_style: "default",
    hero_gradient: "primary",
    page_background: "default"
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
        sidebar_style: (data as any)?.sidebar_style || "default",
        card_style: (data as any)?.card_style || "default",
        hero_gradient: (data as any)?.hero_gradient || "primary",
        page_background: (data as any)?.page_background || "default"
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
        {/* Sidebar Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Sidebar Style</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SIDEBAR_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSettings({ ...settings, sidebar_style: style.id })}
                className={cn(
                  "relative flex flex-col items-center p-2.5 rounded-xl border-2 transition-all hover:scale-[1.02]",
                  settings.sidebar_style === style.id
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className={cn("w-full h-14 rounded-lg mb-2 relative overflow-hidden", style.preview)}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                  </div>
                </div>
                <span className="text-xs font-medium">{style.name}</span>
                {settings.sidebar_style === style.id && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Page Background */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">Page Background</Label>
          </div>
          
          {/* Category labels and backgrounds */}
          {[
            { key: "basic", label: "Basic" },
            { key: "warm", label: "Warm Colors" },
            { key: "cool", label: "Cool Colors" },
            { key: "nature", label: "Nature" },
            { key: "purple", label: "Purple & Violet" },
            { key: "neutral", label: "Neutral & Elegant" },
            { key: "pattern", label: "Patterns" },
          ].map((category) => {
            const categoryBackgrounds = PAGE_BACKGROUNDS.filter(bg => bg.category === category.key);
            if (categoryBackgrounds.length === 0) return null;
            
            return (
              <div key={category.key} className="space-y-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{category.label}</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {categoryBackgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSettings({ ...settings, page_background: bg.id })}
                      className={cn(
                        "relative flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:scale-[1.02]",
                        settings.page_background === bg.id
                          ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-background"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <div className={cn("w-full h-10 rounded-md mb-1.5 border border-border/50", bg.preview)} />
                      <span className="text-[10px] font-medium truncate w-full text-center">{bg.name}</span>
                      {settings.page_background === bg.id && (
                        <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-2 w-2 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
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
                <div className={cn("w-full h-10 rounded-lg mb-2 bg-card", style.borderClass, style.shadowClass)} />
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

        {/* Live Preview */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Live Preview</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-muted/30">
            {/* Sidebar Preview */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Sidebar</span>
              <div className={cn(
                "h-28 w-16 rounded-lg relative overflow-hidden",
                SIDEBAR_STYLES.find(s => s.id === settings.sidebar_style)?.preview || "bg-sidebar"
              )}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                </div>
                <div className="p-2 space-y-1.5">
                  <div className="h-1.5 w-10 bg-white/30 rounded" />
                  <div className="h-1.5 w-8 bg-white/20 rounded" />
                  <div className="h-1.5 w-12 bg-white/20 rounded" />
                </div>
              </div>
            </div>

            {/* Page Preview */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Page</span>
              <div className={cn(
                "h-28 rounded-lg border",
                PAGE_BACKGROUNDS.find(b => b.id === settings.page_background)?.preview || "bg-background"
              )}>
                <div className="p-2">
                  <div className="h-6 w-full rounded bg-muted/50" />
                </div>
              </div>
            </div>

            {/* Hero Preview */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Hero</span>
              <div className={cn(
                "h-28 rounded-lg relative overflow-hidden",
                HERO_GRADIENTS.find(g => g.id === settings.hero_gradient)?.preview || "bg-gradient-to-br from-primary/90 via-primary to-primary/80"
              )}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-8 h-8 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                </div>
                <div className="p-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white/30 ring-2 ring-white/30" />
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-white/40 rounded" />
                    <div className="h-1.5 w-10 bg-white/25 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !hasChanges} className="min-w-[120px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Styles"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}