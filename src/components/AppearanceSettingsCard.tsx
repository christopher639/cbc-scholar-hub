import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Palette } from "lucide-react";
import { useAppearanceSettings } from "@/hooks/useAppearanceSettings";
import { cn } from "@/lib/utils";

function hslToHex(hsl: string): string {
  const parts = hsl.split(" ");
  if (parts.length !== 3) return "#3b82f6";
  
  const h = parseInt(parts[0]) / 360;
  const s = parseInt(parts[1]) / 100;
  const l = parseInt(parts[2].replace("%", "")) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "210 85% 45%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function AppearanceSettingsCard() {
  const { settings, loading, saving, updateSettings, colorPresets } = useAppearanceSettings();
  const [selectedColor, setSelectedColor] = useState("210 85% 45%");
  const [customHex, setCustomHex] = useState("#3b82f6");

  useEffect(() => {
    if (settings?.primary_color) {
      setSelectedColor(settings.primary_color);
      setCustomHex(hslToHex(settings.primary_color));
    }
  }, [settings]);

  const handlePresetSelect = (hsl: string) => {
    setSelectedColor(hsl);
    setCustomHex(hslToHex(hsl));
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    const hsl = hexToHsl(hex);
    setSelectedColor(hsl);
  };

  const handleSave = async () => {
    await updateSettings(selectedColor);
  };

  const hasChanges = settings?.primary_color !== selectedColor;

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
          Primary Color
        </CardTitle>
        <CardDescription>
          Customize the primary color used throughout the application for buttons, links, and accents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Presets */}
        <div className="space-y-3">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset.hsl)}
                className={cn(
                  "relative h-10 w-full rounded-lg border-2 transition-all hover:scale-105",
                  selectedColor === preset.hsl
                    ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : "border-transparent"
                )}
                style={{ backgroundColor: `hsl(${preset.hsl})` }}
                title={preset.name}
              >
                {selectedColor === preset.hsl && (
                  <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {colorPresets.map((preset) => (
              <span key={preset.name} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: `hsl(${preset.hsl})` }}
                />
                {preset.name}
              </span>
            ))}
          </div>
        </div>

        {/* Custom Color Picker */}
        <div className="space-y-3">
          <Label>Custom Color</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="color"
                value={customHex}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="h-12 w-20 cursor-pointer p-1"
              />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                value={customHex.toUpperCase()}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#3B82F6"
                className="font-mono"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Preview</Label>
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-muted/50">
            <Button
              style={{ backgroundColor: `hsl(${selectedColor})` }}
              className="text-white"
            >
              Primary Button
            </Button>
            <Button
              variant="outline"
              style={{ borderColor: `hsl(${selectedColor})`, color: `hsl(${selectedColor})` }}
            >
              Outline Button
            </Button>
            <span
              style={{ color: `hsl(${selectedColor})` }}
              className="font-medium"
            >
              Link Text
            </span>
            <div
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: `hsl(${selectedColor})` }}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="min-w-[100px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Color"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
