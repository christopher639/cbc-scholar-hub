import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, FileText, User, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";

export function TeacherPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { schoolInfo } = useSchoolInfo();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: teacherData, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user.id)
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

  const navItems = [
    { path: "/teacher-portal", icon: Home, label: "Dashboard" },
    { path: "/teacher-portal/marks", icon: BookOpen, label: "Marks" },
    { path: "/teacher-portal/assignments", icon: FileText, label: "Assignments" },
    { path: "/teacher-portal/profile", icon: User, label: "Profile" },
    { path: "/teacher-portal/settings", icon: Settings, label: "Settings" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {schoolInfo?.logo_url && (
            <img
              src={schoolInfo.logo_url}
              alt="School Logo"
              className="h-8 w-8 object-contain"
            />
          )}
          <span className="font-semibold text-sm">{schoolInfo?.school_name || "School"}</span>
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

        <div className="flex items-center gap-2">
          {teacher?.photo_url && (
            <img
              src={teacher.photo_url}
              alt="Teacher"
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <span className="text-sm font-medium hidden sm:inline">
            {teacher?.first_name} {teacher?.last_name}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-14 pb-16 md:pb-4">
        <Outlet />
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
