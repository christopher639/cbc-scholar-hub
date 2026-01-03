import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, KeyRound, Bell, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { LearnerChangePasswordDialog } from "@/components/LearnerChangePasswordDialog";
import { useAuth } from "@/hooks/useAuth";

export default function LearnerSettings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const learnerId = localStorage.getItem('learner_id') || '';

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences and account settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Appearance</CardTitle>
          </div>
          <CardDescription>Customize how the portal looks for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Dark mode is enabled" : "Enable dark mode for a darker interface"}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Security</CardTitle>
          </div>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Password</Label>
              <p className="text-sm text-muted-foreground">
                Change your account password for better security
              </p>
            </div>
            <Button onClick={() => setShowPasswordDialog(true)} variant="outline" size="sm">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </div>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Performance Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new marks are released
              </p>
            </div>
            <Switch id="perf-notif" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Fee Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders about fee payments
              </p>
            </div>
            <Switch id="fee-notif" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <LearnerChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        learnerId={learnerId}
      />
    </div>
  );
}
