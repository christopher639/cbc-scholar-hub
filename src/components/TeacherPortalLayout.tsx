import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, FileText, User, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TeacherPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { schoolInfo } = useSchoolInfo();
  const { user, loading: authLoading, logout } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "teacher") {
        navigate("/auth", { replace: true });
        return;
      }
      fetchTeacherData();
    }
  }, [user, authLoading, navigate]);

  const fetchTeacherData = async () => {
    try {
      if (!user) return;
      
      // For teacher sessions, user.id is the teacher's id directly
      // and user.data contains the teacher info
      if (user.role === "teacher" && user.data) {
        setTeacher(user.data);
        setLoading(false);
        return;
      }

      // Fallback: fetch from database
      const { data: teacherData, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setTeacher(teacherData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load teacher data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: "/teacher-portal", icon: Home, label: "Dashboard" },
    { path: "/teacher-portal/marks", icon: BookOpen, label: "Marks" },
    { path: "/teacher-portal/assignments", icon: FileText, label: "Assignments" },
    { path: "/teacher-portal/profile", icon: User, label: "Profile" },
    { path: "/teacher-portal/settings", icon: Settings, label: "Settings" },
  ];

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const teacherInitials = teacher 
    ? `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`.toUpperCase()
    : 'T';

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top Bar - Fixed */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center justify-between px-3 md:px-4">
          <div className="flex items-center gap-2">
            {schoolInfo?.logo_url && (
              <img
                src={schoolInfo.logo_url}
                alt="School Logo"
                className="h-7 w-7 md:h-8 md:w-8 object-contain"
              />
            )}
            <span className="font-semibold text-xs md:text-sm truncate max-w-[120px] md:max-w-none">
              {schoolInfo?.school_name || "School"}
            </span>
          </div>

          {/* Large Screen Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Teacher Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={teacher?.photo_url} alt={teacher?.first_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {teacherInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {teacher?.first_name}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{teacher?.first_name} {teacher?.last_name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {teacher?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/teacher-portal/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/teacher-portal/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-14 pb-16 md:pb-4">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <Outlet context={{ teacher }} />
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only - Icons with Tooltips */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border z-50">
          <div className="flex items-center justify-around h-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
