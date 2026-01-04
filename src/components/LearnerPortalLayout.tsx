import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Settings, GraduationCap, Home, DollarSign, Search, UserCircle, Menu, PanelLeft, PanelLeftClose, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LearnerChangePasswordDialog } from "@/components/LearnerChangePasswordDialog";
import { Progress } from "@/components/ui/progress";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useLearnerPortalCache } from "@/hooks/useLearnerCache";
import { PortalFooter } from "@/components/PortalFooter";
import { useUIStyles } from "@/hooks/useUIStyles";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigationItems = [
  { title: "Dashboard", url: "/learner-portal", icon: Home },
  { title: "My Fees", url: "/learner-portal/fees", icon: DollarSign },
  { title: "Fee Structures", url: "/learner-portal/fee-structures", icon: Search },
  { title: "Timetable", url: "/learner-portal/timetable", icon: Calendar },
  { title: "Settings", url: "/learner-portal/settings", icon: Settings },
  { title: "Profile", url: "/learner-portal/profile", icon: UserCircle },
];

function LearnerSidebar({ onNavigate, isNavigating, schoolInfo, onLogout }: { onNavigate: (url: string) => void; isNavigating: boolean; schoolInfo: any; onLogout: () => void }) {
  const location = useLocation();
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { getSidebarClass, getSidebarStyle, getSidebarTextType, isGradientSidebar } = useUIStyles();
  const isGradient = isGradientSidebar();
  const sidebarTextType = getSidebarTextType();
  // Use light text for dark backgrounds, dark text for light backgrounds
  const useLightText = isGradient && sidebarTextType !== 'dark';

  const isActive = (path: string) => {
    if (path === "/learner-portal") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (url: string) => {
    onNavigate(url);
    // Close mobile sidebar after navigation
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className={cn("border-r border-border/30 relative overflow-hidden", getSidebarClass())} style={getSidebarStyle()}>
      {/* Decorative bubbles */}
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-10",
        !useLightText && "hidden"
      )}>
        <div className={cn(
          "absolute top-0 left-0 w-20 h-20 rounded-full -translate-x-1/2 -translate-y-1/2",
          useLightText ? "bg-white" : "bg-primary"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-32 h-32 rounded-full translate-x-1/3 translate-y-1/3",
          useLightText ? "bg-white" : "bg-primary"
        )} />
        <div className={cn(
          "absolute top-1/3 right-0 w-16 h-16 rounded-full translate-x-1/2",
          useLightText ? "bg-white" : "bg-primary"
        )} />
      </div>
      
      <div className="flex h-16 items-center justify-between px-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          {schoolInfo?.logo_url ? (
            <div
              className={cn(
                "relative -mt-1 h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-background/20",
                useLightText && "shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
              )}
            >
              <img
                src={schoolInfo.logo_url}
                alt="School Logo"
                className="h-full w-full object-contain p-1"
              />
            </div>
          ) : (
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
              useLightText ? "bg-white/20" : isGradient ? "bg-black/10" : "bg-primary/10"
            )}>
              <GraduationCap className={cn("h-4 w-4", useLightText ? "text-white" : isGradient ? "text-slate-900" : "text-primary-foreground")} />
            </div>
          )}
          {!collapsed && (
            <span className={cn(
              "font-semibold text-sm truncate",
              useLightText ? "text-white" : isGradient ? "text-slate-900" : "text-sidebar-foreground"
            )}>{schoolInfo?.school_name || "Learner Portal"}</span>
          )}
        </div>
        <SidebarTrigger className={cn(
          "ml-auto hidden lg:flex", 
          useLightText ? "text-white hover:bg-white/10" : isGradient ? "text-slate-900 hover:bg-black/10" : ""
        )}>
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </SidebarTrigger>
      </div>

      <SidebarContent className="flex flex-col relative z-10">
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive(item.url)}
                          className={cn(
                            "cursor-pointer",
                            useLightText && "text-white/90 hover:text-white hover:bg-white/10",
                            !useLightText && isGradient && "text-slate-900/90 hover:text-slate-900 hover:bg-black/10",
                            isActive(item.url) && (useLightText 
                              ? "bg-white/20 text-white font-medium" 
                              : isGradient 
                                ? "bg-black/20 text-slate-900 font-medium"
                                : "bg-primary text-primary-foreground")
                          )}
                          onClick={() => handleNavigate(item.url)}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          {item.title}
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
                          useLightText 
                            ? "text-white/80 hover:bg-white/10 hover:text-white" 
                            : isGradient 
                              ? "text-slate-900/80 hover:bg-black/10 hover:text-slate-900"
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

export default function LearnerPortalLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const isLearner = user?.role === "learner";
  const learner = isLearner ? user.data : null;
  const location = useLocation();

  // Use cache to load UI instantly
  const { learnerData: cachedLearner, schoolData: cachedSchool, updateCache } = useLearnerPortalCache(learner?.id || "");
  
  const [learnerDetails, setLearnerDetails] = useState<any>(cachedLearner);
  const [schoolInfo, setSchoolInfo] = useState<any>(cachedSchool);
  const [loading, setLoading] = useState(!cachedLearner);

  // Update state when cached data arrives
  useEffect(() => {
    if (cachedLearner) {
      setLearnerDetails(cachedLearner);
      setLoading(false);
    }
    if (cachedSchool) {
      setSchoolInfo(cachedSchool);
    }
  }, [cachedLearner, cachedSchool]);

  useEffect(() => {
    if (!authLoading && !isLearner) {
      navigate("/auth", { replace: true });
    } else if (isLearner && learner) {
      fetchData();
    }
  }, [authLoading, isLearner, learner, navigate]);

  // Reset loading state when location changes
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => setIsNavigating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const fetchData = async () => {
    if (!learner) return;

    try {
      // Don't show loading if we have cached data
      if (!cachedLearner) {
        setLoading(true);
      }

      // Use learner data from auth context - it was already validated during login
      // and fetch grade/stream names separately
      const [gradeResult, streamResult, schoolResult] = await Promise.all([
        learner.current_grade_id 
          ? supabase.from("grades").select("name").eq("id", learner.current_grade_id).maybeSingle()
          : Promise.resolve({ data: null }),
        learner.current_stream_id 
          ? supabase.from("streams").select("name").eq("id", learner.current_stream_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("school_info").select("*").single()
      ]);

      // Build learner details from auth context data + fetched grade/stream names
      const learnerData = {
        ...learner,
        current_grade: gradeResult.data,
        current_stream: streamResult.data
      };

      // Update state and cache
      setLearnerDetails(learnerData);
      setSchoolInfo(schoolResult.data);
      await updateCache(learnerData, schoolResult.data);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (!cachedLearner) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleNavigate = (url: string) => {
    if (location.pathname === url) return;
    setIsNavigating(true);
    navigate(url);
  };

  const isActive = (path: string) => {
    if (path === "/learner-portal") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Show loading skeleton only on first load without cache
  if (authLoading || (loading && !cachedLearner)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-96" />
        </div>
      </div>
    );
  }

  if (!isLearner) {
    return null;
  }

  // Use cached data if available, otherwise wait for fresh data
  const displayLearner = learnerDetails || cachedLearner;
  const displaySchool = schoolInfo || cachedSchool;

  if (!displayLearner) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Sidebar - visible as drawer on mobile when triggered */}
        <LearnerSidebar onNavigate={handleNavigate} isNavigating={isNavigating} schoolInfo={displaySchool} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Loading Progress Bar */}
          {isNavigating && (
            <div className="fixed top-0 left-0 right-0 z-[60] h-1">
              <Progress value={66} className="h-1 rounded-none" />
            </div>
          )}

          {/* Fixed Header */}
          <header className="fixed top-0 left-0 right-0 md:left-auto z-50 w-full border-b border-border/30 bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6 gap-4 w-full">
              {/* Left - Sidebar Trigger (mobile) and School Logo */}
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                <SidebarTrigger className="md:hidden flex-shrink-0">
                  <Menu className="h-6 w-6" />
                </SidebarTrigger>

                {displaySchool?.logo_url ? (
                  <div className="h-10 w-10 md:h-10 md:w-10 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0 bg-background/20">
                    <img
                      src={displaySchool.logo_url}
                      alt="School Logo"
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-primary/20 flex-shrink-0">
                    <GraduationCap className="h-5 w-5 md:h-5 md:w-5 text-primary-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h1 className="text-sm md:text-base font-bold leading-tight text-foreground truncate">
                    {displaySchool?.school_name || "School Portal"}
                  </h1>
                  <p className="hidden md:block text-sm text-muted-foreground">
                    {displaySchool?.motto || "Learner Portal"}
                  </p>
                </div>
              </div>

              {/* Right - PWA Install Button and User Profile */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <PWAInstallButton />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 hover:bg-transparent">
                      <Avatar className="h-9 w-9 md:h-10 md:w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                        <AvatarImage src={displayLearner.photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-xs md:text-sm">
                          {displayLearner.first_name[0]}{displayLearner.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold">{displayLearner.first_name} {displayLearner.last_name}</p>
                        <p className="text-xs text-muted-foreground">Admission: {displayLearner.admission_number}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setIsNavigating(true);
                      navigate("/learner-portal/profile");
                    }} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPasswordDialog(true)} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Change Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 mb-14 md:mb-0 overflow-auto relative pt-14 md:pt-16">
            <div className={cn("transition-opacity duration-200", isNavigating && "opacity-50 pointer-events-none")}>
              <Outlet context={{ learnerDetails: displayLearner, schoolInfo: displaySchool, refetch: fetchData }} />
            </div>
            
            {/* Footer - Hidden on mobile (bottom nav takes that space) */}
            <div className="hidden md:block">
              <PortalFooter schoolInfo={displaySchool} />
            </div>
          </main>

          {/* Mobile Bottom Navigation - Icons only */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30 bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60 safe-area-inset-bottom">
            <div className="flex items-center justify-around h-14 px-2">
              {navigationItems.slice(0, 5).map((item) => (
                <Button
                  key={item.url}
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigate(item.url)}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all",
                    isActive(item.url) 
                      ? "text-primary bg-primary/15 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 transition-transform", isActive(item.url) && "scale-110")} />
                </Button>
              ))}
            </div>
          </nav>
        </div>

        {/* Password Change Dialog */}
        {displayLearner && (
          <LearnerChangePasswordDialog
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            learnerId={displayLearner.id}
          />
        )}

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </SidebarProvider>
  );
}
