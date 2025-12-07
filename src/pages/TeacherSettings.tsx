import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, User, Moon } from "lucide-react";

interface OutletContext {
  teacher: any;
}

export default function TeacherSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { teacher } = useOutletContext<OutletContext>();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the portal looks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>Dark Mode</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Toggle dark mode on or off
                </span>
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your login credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Employee Number (Username)</p>
              <p className="font-medium">{teacher?.employee_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID Number (Password)</p>
              <p className="font-medium">{teacher?.id_number ? "••••••••" : "N/A"}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact the administrator to update your login credentials.
            </p>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Logout
            </CardTitle>
            <CardDescription>
              Sign out of your teacher account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
