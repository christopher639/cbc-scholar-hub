import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  Settings,
  FileText,
  Menu,
  X,
  LogOut,
  School,
  UserCog,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "teacher"] },
  { name: "Learners", href: "/students", icon: Users, roles: ["admin", "teacher"] },
  { name: "Grades & Streams", href: "/grades", icon: GraduationCap, roles: ["admin", "teacher"] },
  { name: "Performance", href: "/performance", icon: FileText, roles: ["admin", "teacher"] },
  { name: "Teachers", href: "/teachers", icon: UserCog, roles: ["admin", "teacher"] },
  { name: "Fee Management", href: "/fees", icon: DollarSign, roles: ["admin"] },
  { name: "Communication", href: "/communication", icon: MessageSquare, roles: ["admin"] },
  { name: "Admissions", href: "/admissions", icon: UserCheck, roles: ["admin"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["admin", "teacher"] },
  { name: "School Info", href: "/school-info", icon: School, roles: ["admin", "teacher"] },
  { name: "Users & Roles", href: "/users", icon: ShieldCheck, roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUnifiedAuth();
  const { toast } = useToast();
  const { schoolInfo } = useSchoolInfo();

  useEffect(() => {
    if (user && !profile) {
      loadProfile();
    }
  }, [user, profile]);

  const loadProfile = async () => {
    try {
      if (user?.role === "admin") {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user?.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      } else if (user?.role === "teacher") {
        setProfile({
          full_name: `${user.data.first_name} ${user.data.last_name}`,
          avatar_url: null,
        });
      } else if (user?.role === "learner") {
        setProfile({
          full_name: `${user.data.first_name} ${user.data.last_name}`,
          avatar_url: user.data.photo_url,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const getInitials = () => {
    if (!profile?.full_name) return "U";
    return profile.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          {schoolInfo?.logo_url ? (
            <img src={schoolInfo.logo_url} alt="School Logo" className="h-16 w-16 object-contain rounded-full" />
          ) : (
            <GraduationCap className="h-16 w-16 text-primary" />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-base">
              {schoolInfo?.school_name || "School"}
            </span>
          
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="flex flex-col gap-1 p-4">
            {navigation
              .filter((item) => !item.roles || item.roles.includes(user?.role || ""))
              .map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          <div className="mt-auto border-t border-border p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => navigate("/profile")}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-foreground">
                {profile?.full_name || "User"}
              </span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
