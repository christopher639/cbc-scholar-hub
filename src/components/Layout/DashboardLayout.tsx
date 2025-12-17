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
  { name: "Performance", href: "/performance", icon: FileText, roles: ["admin", "teacher", "finance", "visitor"] },
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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

  return (
    <Sidebar collapsible="icon" className="bg-card">
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {schoolInfo?.logo_url ? (
              <img src={schoolInfo.logo_url} alt="School Logo" className="h-10 w-10 object-contain rounded-full" />
            ) : (
              <GraduationCap className="h-10 w-10 text-primary" />
            )}
            <span className="font-semibold text-sm">
              {schoolInfo?.school_name || "School"}
            </span>
          </div>
        )}
        <SidebarTrigger className="ml-auto hidden lg:flex">
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </SidebarTrigger>
      </div>

      <SidebarContent className="bg-card">
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
                              isActive && "bg-primary text-primary-foreground",
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
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
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
                  className="w-full justify-start gap-2"
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

  return (
    <SidebarProvider defaultOpen>
      <div className="h-screen w-full flex bg-background overflow-hidden">
        <AppSidebar onNavigate={navigateTo} isNavigating={isNavigating} pendingPath={pendingPath} />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-card px-3 sm:px-6">
            <SidebarTrigger className="lg:hidden">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            
            {/* School Logo and Name - visible on small screens */}
            <div className="flex lg:hidden items-center gap-2">
              {schoolInfo?.logo_url ? (
                <img src={schoolInfo.logo_url} alt="School Logo" className="h-8 w-8 object-contain rounded-full" />
              ) : (
                <GraduationCap className="h-8 w-8 text-primary" />
              )}
              <span className="font-semibold text-sm truncate max-w-[120px] sm:max-w-[180px]">
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

            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <NotificationsDropdown />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-foreground">
                      {profile?.full_name || getInitials()}
                    </span>
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

          <div className="flex-1 overflow-auto p-4 sm:p-6 pb-24 lg:pb-6">
            {children}
          </div>
          
          {/* Bottom Navigation - Mobile Only */}
          <BottomNavigation onNavigate={navigateTo} isNavigating={isNavigating} pendingPath={pendingPath} />
        </main>
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
  
  // Only show for admin, finance, and visitor on small screens
  if (!["admin", "finance", "visitor"].includes(user?.role || "")) return null;
  
  const bottomNavItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Learners", href: "/learners", icon: Users },
    { name: "Fees", href: "/fees", icon: DollarSign },
    { name: "Performance", href: "/performance", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    onNavigate(href);
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden h-16 items-center justify-around bg-card px-2">
      {bottomNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        const isPending = pendingPath === item.href;
        return (
          <button
            key={item.name}
            onClick={(e) => handleNavClick(e, item.href)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              isPending && "opacity-70"
            )}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <item.icon className="h-5 w-5" />
            )}
            <span className="text-[10px] font-medium">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
