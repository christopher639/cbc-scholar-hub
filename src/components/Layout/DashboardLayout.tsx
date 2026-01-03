import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SchoolAssistantChat } from "@/components/SchoolAssistantChat";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { useAdminNavigation } from "@/hooks/useAdminNavigation";
import { useUIStyles } from "@/hooks/useUIStyles";
import { RightSidePanel } from "@/components/Layout/RightSidePanel";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  UserCheck,
  Settings,
  FileText,
  LogOut,
  School,
  UserCog,
  ShieldCheck,
  MessageSquare,
  User,
  PanelLeftClose,
  PanelLeft,
  Menu,
  HardDrive,
  Coins,
  Bell,
  Moon,
  Sun,
  Monitor,
  Loader2,
  Unlock,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Theme toggle component for dark/light/system mode
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "dark") return <Moon className="h-5 w-5" />;
    if (theme === "light") return <Sun className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getTooltip = () => {
    if (theme === "dark") return "Dark mode (click for system)";
    if (theme === "light") return "Light mode (click for dark)";
    return "System mode (click for light)";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={cycleTheme} className="h-9 w-9">
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltip()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { Newspaper, Images, BookOpen, Home, Building2 } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "finance", "visitor"] },
  { name: "Learners", href: "/learners", icon: Users, roles: ["admin", "teacher", "finance", "visitor"] },
  { name: "Grades & Streams", href: "/grades", icon: GraduationCap, roles: ["admin", "teacher", "finance", "visitor"] },
  { name: "Houses", href: "/houses", icon: Home, roles: ["admin", "finance", "visitor"] },
  { name: "Learning Areas", href: "/learning-areas", icon: BookOpen, roles: ["admin", "finance", "visitor"] },
  { name: "Release Marks", href: "/release-marks", icon: Unlock, roles: ["admin", "finance", "visitor"] },
  { name: "Teachers", href: "/teachers", icon: UserCog, roles: ["admin", "finance", "visitor"] },
  { name: "Departments", href: "/departments", icon: Building2, roles: ["admin", "finance", "visitor"] },
  { name: "Non-Teaching Staff", href: "/non-teaching-staff", icon: Users, roles: ["admin", "finance", "visitor"] },
  { name: "Finance", href: "/fees", icon: DollarSign, roles: ["admin", "finance", "visitor"] },
  { name: "Academic Settings", href: "/academic-settings", icon: Settings, roles: ["admin", "finance", "visitor"] },
  { name: "Programs", href: "/programs", icon: BookOpen, roles: ["admin", "finance", "visitor"] },
  { name: "Blogs", href: "/blogs", icon: Newspaper, roles: ["admin", "finance", "visitor"] },
  { name: "Gallery", href: "/gallery", icon: Images, roles: ["admin", "finance", "visitor"] },
  { name: "Communication", href: "/communication", icon: MessageSquare, roles: ["admin", "finance", "visitor"] },
  { name: "Admissions", href: "/admissions", icon: UserCheck, roles: ["admin", "finance", "visitor"] },
  { name: "Alumni", href: "/alumni", icon: GraduationCap, roles: ["admin", "teacher", "finance", "visitor"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["admin", "teacher", "finance", "visitor"] },
  { name: "Learner Reports", href: "/bulk-learner-reports", icon: FileText, roles: ["admin", "finance", "visitor"] },
  { name: "Users & Roles", href: "/users", icon: ShieldCheck, roles: ["admin", "finance", "visitor"] },
  { name: "Activities", href: "/activities", icon: FileText, roles: ["admin", "finance", "visitor"] },
  { name: "Offline Storage", href: "/offline-storage", icon: HardDrive, roles: ["admin", "finance", "visitor"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "finance", "visitor"] },
];

// Separate item for Public Website at bottom
const publicWebsiteLink = { name: "Public Website", href: "/", icon: School, roles: ["admin", "visitor"], external: true };

function AppSidebar({ onNavigate, isNavigating, pendingPath }: { onNavigate: (path: string) => void; isNavigating: boolean; pendingPath: string | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { schoolInfo } = useSchoolInfo();
  const { state, isMobile, openMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { getSidebarClass, getSidebarStyle, getSidebarTextType, isGradientSidebar, loading: stylesLoading } = useUIStyles();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  const filteredNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "")
  );

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    onNavigate(href);
  };

  const sidebarClass = getSidebarClass();
  const sidebarStyle = getSidebarStyle();
  const isGradient = isGradientSidebar();
  const sidebarTextType = getSidebarTextType();
  
  // Determine if we should use light text styling (for gradient or dark hex colors)
  const useLightText = isGradient && sidebarTextType !== 'dark';

  return (
    <Sidebar collapsible="icon" className={cn(sidebarClass, "relative overflow-hidden")} style={sidebarStyle}>
      {/* Decorative pattern for gradient sidebars */}
      {isGradient && (
        <div className={cn(
          "absolute inset-0 pointer-events-none opacity-10",
          useLightText ? "" : "hidden"
        )}>
          <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/3 right-0 w-16 h-16 bg-white rounded-full translate-x-1/2" />
        </div>
      )}
      
        <div className="flex h-16 items-center justify-between px-4 relative z-10">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              {schoolInfo?.logo_url ? (
                <div
                  className={cn(
                    "relative -mt-2 h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-background/20",
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
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                    useLightText ? "bg-white/20" : isGradient ? "bg-black/10" : "bg-primary/10"
                  )}
                >
                  <GraduationCap
                    className={cn(
                      "h-5 w-5",
                      useLightText ? "text-white" : isGradient ? "text-slate-900" : "text-primary"
                    )}
                  />
                </div>
              )}
              <span
                className={cn(
                  "font-semibold text-sm truncate min-w-0",
                  useLightText ? "text-white" : isGradient ? "text-slate-900" : "text-sidebar-foreground"
                )}
              >
                {schoolInfo?.school_name || "School"}
              </span>
            </div>
          )}
          <SidebarTrigger
            className={cn(
              "ml-auto hidden lg:flex",
              useLightText ? "text-white hover:bg-white/10" : isGradient ? "text-slate-900 hover:bg-black/10" : ""
            )}
          >
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </SidebarTrigger>
        </div>

      <SidebarContent className="relative z-10">
      <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.href;
                const isPending = pendingPath === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            isActive={isActive}
                            className={cn(
                              "cursor-pointer",
                              useLightText && "text-white/90 hover:text-white hover:bg-white/10",
                              !useLightText && isGradient && "text-slate-900/90 hover:text-slate-900 hover:bg-black/10",
                              isActive && (useLightText 
                                ? "bg-white/20 text-white font-medium" 
                                : isGradient 
                                  ? "bg-black/20 text-slate-900 font-medium"
                                  : "bg-primary text-primary-foreground"),
                              isPending && "opacity-70"
                            )}
                            onClick={(e) => handleNavClick(e, item.href)}
                          >
                            {isPending ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <item.icon className="h-5 w-5" />
                            )}
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            {item.name}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-2 space-y-1">
          {/* Public Website Link at bottom */}
          {(user?.role === "admin" || user?.role === "visitor") && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={publicWebsiteLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors",
                      useLightText 
                        ? "text-white/90 hover:text-white hover:bg-white/10" 
                        : isGradient
                          ? "text-slate-900/90 hover:text-slate-900 hover:bg-black/10"
                          : "hover:bg-muted"
                    )}
                  >
                    <publicWebsiteLink.icon className="h-5 w-5" />
                    {!collapsed && <span>{publicWebsiteLink.name}</span>}
                  </a>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {publicWebsiteLink.name}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    useLightText && "text-white/90 hover:text-white hover:bg-white/10",
                    !useLightText && isGradient && "text-slate-900/90 hover:text-slate-900 hover:bg-black/10"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  {!collapsed && <span>Logout</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

// Global cache for user profile to prevent re-fetching on every route change
let profileCache: { full_name: string; avatar_url: string | null } | null = null;
let profileCacheUserId: string | null = null;

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [profile, setProfile] = useState<any>(profileCache);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { schoolInfo } = useSchoolInfo();
  const { navigateTo, isNavigating, pendingPath } = useAdminNavigation();

  const handleLogout = async () => {
    // Clear profile cache on logout
    profileCache = null;
    profileCacheUserId = null;
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  useEffect(() => {
    if (user && user.id !== profileCacheUserId) {
      loadProfile();
    } else if (user && profileCache) {
      setProfile(profileCache);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      if (user?.role === "admin" || user?.role === "finance" || user?.role === "visitor") {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user?.id)
          .maybeSingle();
        
        const profileData = {
          full_name: data?.full_name || user?.data?.email || "User",
          avatar_url: data?.avatar_url || null,
        };
        
        // Update cache
        profileCache = profileData;
        profileCacheUserId = user?.id || null;
        setProfile(profileData);
      } else if (user?.role === "teacher") {
        const profileData = {
          full_name: `${user.data.first_name} ${user.data.last_name}`,
          avatar_url: null,
        };
        profileCache = profileData;
        profileCacheUserId = user?.id || null;
        setProfile(profileData);
      } else if (user?.role === "learner") {
        const profileData = {
          full_name: `${user.data.first_name} ${user.data.last_name}`,
          avatar_url: user.data.photo_url,
        };
        profileCache = profileData;
        profileCacheUserId = user?.id || null;
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      const fallbackProfile = {
        full_name: user?.data?.email || "User",
        avatar_url: null,
      };
      profileCache = fallbackProfile;
      profileCacheUserId = user?.id || null;
      setProfile(fallbackProfile);
    }
  };

  const getInitials = () => {
    if (!profile?.full_name) {
      // Try to get initials from email if no full name
      if (user?.data?.email) {
        return user.data.email[0].toUpperCase();
      }
      return "U";
    }
    return profile.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const { getPageBackgroundClass, getPageBackgroundStyle, getTopbarClass, getBottomNavClass } = useUIStyles();

  return (
    <SidebarProvider>
      <div className={cn("h-screen w-full flex overflow-hidden", getPageBackgroundClass())} style={getPageBackgroundStyle()}>
        <AppSidebar onNavigate={navigateTo} isNavigating={isNavigating} pendingPath={pendingPath} />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className={cn(
            "sticky top-0 z-30 flex h-14 md:h-16 shrink-0 items-center gap-2 md:gap-3 border-b px-3 sm:px-4 md:px-6",
            getTopbarClass()
          )}>
            <SidebarTrigger className="lg:hidden">
              <Menu className="h-5 w-5 md:h-6 md:w-6" />
            </SidebarTrigger>
            
            {/* School Logo and Name - visible on small screens */}
            <div className="flex lg:hidden items-center gap-2 min-w-0 flex-1">
              {schoolInfo?.logo_url ? (
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0 bg-background/20">
                  <img
                    src={schoolInfo.logo_url}
                    alt="School Logo"
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-primary/20 flex-shrink-0">
                  <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                </div>
              )}
              <span className="font-semibold text-sm truncate min-w-0">
                {schoolInfo?.school_name || "School"}
              </span>
            </div>
            
            {/* Admin Search Bar - Centered between sidebar and notifications */}
            {user?.role === "admin" && (
              <div className="hidden lg:flex flex-1 justify-center px-8">
                <div className="w-full max-w-2xl">
                  <AdminSearchBar />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 ml-auto flex-shrink-0">
              <NotificationsDropdown />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 hover:bg-transparent">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-xs md:text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigateTo("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigateTo("/settings")} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 overflow-auto px-1 sm:px-2 md:px-4 py-2 md:py-4 pb-20 lg:pb-4">
            {children}
          </div>
          
          {/* Bottom Navigation - Mobile Only */}
          <BottomNavigation onNavigate={navigateTo} isNavigating={isNavigating} pendingPath={pendingPath} />
        </main>
        
        {/* Right Side Panel - Gmail Style */}
        {(user?.role === "admin" || user?.role === "finance") && <RightSidePanel />}
        
        <OfflineIndicator />
        {user?.role === "admin" && <SchoolAssistantChat />}
      </div>
    </SidebarProvider>
  );
}

// Bottom Navigation Component for mobile
function BottomNavigation({ onNavigate, isNavigating, pendingPath }: { onNavigate: (path: string) => void; isNavigating: boolean; pendingPath: string | null }) {
  const location = useLocation();
  const { user } = useAuth();
  const { getBottomNavClass } = useUIStyles();
  
  // Only show for admin, finance, and visitor on small screens
  if (!["admin", "finance", "visitor"].includes(user?.role || "")) return null;
  
  const bottomNavItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Learners", href: "/learners", icon: Users },
    { name: "Fees", href: "/fees", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    onNavigate(href);
  };
  
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t safe-area-inset-bottom",
      getBottomNavClass()
    )}>
      <div className="flex items-center justify-around h-14 px-2">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isPending = pendingPath === item.href;
          return (
            <button
              key={item.name}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-full transition-all",
                isActive 
                  ? "text-primary bg-primary/15 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                isPending && "opacity-70"
              )}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
