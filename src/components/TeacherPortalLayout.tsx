import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, FileText, User, Settings, LogOut, GraduationCap, PanelLeft, PanelLeftClose, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { PortalFooter } from "@/components/PortalFooter";
import { useUIStyles } from "@/hooks/useUIStyles";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { path: "/teacher-portal", icon: Home, label: "Dashboard" },
  { path: "/teacher-portal/marks", icon: BookOpen, label: "Marks" },
  { path: "/teacher-portal/assignments", icon: FileText, label: "Assignments" },
  { path: "/teacher-portal/profile", icon: User, label: "Profile" },
  { path: "/teacher-portal/settings", icon: Settings, label: "Settings" },
];

function TeacherSidebar({ schoolInfo, onLogout }: { schoolInfo: any; onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { getSidebarClass, isGradientSidebar } = useUIStyles();
  const isGradient = isGradientSidebar();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    // Close mobile sidebar after navigation
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className={cn("border-r border-border/30 relative overflow-hidden", getSidebarClass())}>
      {/* Decorative bubbles for gradient sidebars */}
      {isGradient && (
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/3 right-0 w-16 h-16 bg-white rounded-full translate-x-1/2" />
        </div>
      )}
      
      <div className="flex h-16 items-center justify-between px-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          {schoolInfo?.logo_url ? (
            <div className="relative -mt-1">
              <img 
                src={schoolInfo.logo_url} 
                alt="School Logo" 
                className={cn(
                  "h-10 w-10 object-contain drop-shadow-lg",
                  isGradient && "drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
                )} 
              />
            </div>
          ) : (
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
              isGradient ? "bg-white/20" : "bg-primary/10"
            )}>
              <GraduationCap className={cn("h-4 w-4", isGradient ? "text-white" : "text-primary-foreground")} />
            </div>
          )}
          {!collapsed && (
            <span className={cn(
              "font-semibold text-sm truncate",
              isGradient ? "text-white" : "text-sidebar-foreground"
            )}>{schoolInfo?.school_name || "Teacher Portal"}</span>
          )}
        </div>
        <SidebarTrigger className={cn("ml-auto hidden lg:flex", isGradient && "text-white hover:bg-white/10")}>
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </SidebarTrigger>
      </div>

      <SidebarContent className={cn("flex flex-col relative z-10", getSidebarClass())}>
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive(item.path)}
                          className={cn(
                            "cursor-pointer",
                            isGradient && "text-white/90 hover:text-white hover:bg-white/10",
                            isActive(item.path) && (isGradient 
                              ? "bg-white/20 text-white font-medium" 
                              : "bg-primary text-primary-foreground")
                          )}
                          onClick={() => handleNavigate(item.path)}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout at bottom of sidebar */}
        <SidebarGroup className="mt-auto border-t border-border/30 pt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                          "cursor-pointer",
                          isGradient 
                            ? "text-white/80 hover:bg-white/10 hover:text-white" 
                            : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                        )}
                        onClick={onLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        Logout
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

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
      
      if (user.role === "teacher" && user.data) {
        setTeacher(user.data);
        setLoading(false);
        return;
      }

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

  const isActive = (path: string) => location.pathname === path;

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
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Sidebar - Hidden on mobile, visible as drawer on mobile when triggered */}
        <TeacherSidebar schoolInfo={schoolInfo} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Fixed Header */}
          <header className="fixed top-0 left-0 right-0 md:left-auto z-50 w-full border-b border-border/30 bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6 gap-4 w-full">
              {/* Left - Sidebar Trigger (mobile) and School Logo */}
              <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <SidebarTrigger className="md:hidden">
                  <Menu className="h-6 w-6" />
                </SidebarTrigger>
                
                {schoolInfo?.logo_url ? (
                  <img src={schoolInfo.logo_url} alt="School Logo" className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-primary/20">
                    <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                  </div>
                )}
                <div>
                  <h1 className="text-xs sm:text-sm md:text-base font-bold leading-tight text-foreground whitespace-nowrap">{schoolInfo?.school_name || "School Portal"}</h1>
                  <p className="hidden md:block text-xs text-muted-foreground">{schoolInfo?.motto || "Teacher Portal"}</p>
                </div>
              </div>

              {/* Right - Teacher Avatar Dropdown */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 hover:bg-transparent">
                      <Avatar className="h-9 w-9 md:h-10 md:w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                        <AvatarImage src={teacher?.photo_url} alt={teacher?.first_name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-xs md:text-sm">
                          {teacherInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
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
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 mb-14 md:mb-0 overflow-auto pt-14 md:pt-16">
            <div className="max-w-7xl mx-auto px-1 sm:px-2 md:px-4 py-2 md:py-4">
              <Outlet context={{ teacher }} />
            </div>
            
            {/* Footer - Hidden on mobile */}
            <div className="hidden md:block">
              <PortalFooter schoolInfo={schoolInfo} />
            </div>
          </main>

          {/* Mobile Bottom Navigation - Icons only */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30 bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-14 px-2">
              {navItems.slice(0, 5).map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all",
                    isActive(item.path) 
                      ? "text-primary bg-primary/15 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 transition-transform", isActive(item.path) && "scale-110")} />
                </Button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}
