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
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { AdminSearchBar } from "@/components/AdminSearchBar";
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

import { Newspaper, Images } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { name: "Learners", href: "/learners", icon: Users, roles: ["admin", "teacher"] },
  { name: "Grades & Streams", href: "/grades", icon: GraduationCap, roles: ["admin", "teacher"] },
  { name: "Performance", href: "/performance", icon: FileText, roles: ["admin", "teacher"] },
  { name: "Teachers", href: "/teachers", icon: UserCog, roles: ["admin"] },
  { name: "Non-Teaching Staff", href: "/non-teaching-staff", icon: Users, roles: ["admin"] },
  { name: "Fee Management", href: "/fees", icon: DollarSign, roles: ["admin"] },
  { name: "Learner Fees", href: "/learner-fees", icon: DollarSign, roles: ["admin"] },
  { name: "Invoices", href: "/invoices", icon: FileText, roles: ["admin"] },
  { name: "Fee Structures", href: "/fee-structures", icon: Coins, roles: ["admin"] },
  { name: "Academic Settings", href: "/academic-settings", icon: Settings, roles: ["admin"] },
  { name: "Blogs", href: "/blogs", icon: Newspaper, roles: ["admin"] },
  { name: "Gallery", href: "/gallery", icon: Images, roles: ["admin"] },
  { name: "Communication", href: "/communication", icon: MessageSquare, roles: ["admin"] },
  { name: "Admissions", href: "/admissions", icon: UserCheck, roles: ["admin"] },
  { name: "Alumni", href: "/alumni", icon: GraduationCap, roles: ["admin", "teacher"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["admin", "teacher"] },
  { name: "Learner Reports", href: "/bulk-learner-reports", icon: FileText, roles: ["admin"] },
  { name: "School Info", href: "/school-info", icon: School, roles: ["admin"] },
  { name: "Users & Roles", href: "/users", icon: ShieldCheck, roles: ["admin"] },
  { name: "Activities", href: "/activities", icon: FileText, roles: ["admin"] },
  { name: "Offline Storage", href: "/offline-storage", icon: HardDrive, roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];

// Separate item for Public Website at bottom
const publicWebsiteLink = { name: "Public Website", href: "/", icon: School, roles: ["admin"], external: true };

function AppSidebar() {
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

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
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
                return (
                  <SidebarMenuItem key={item.name}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "cursor-pointer",
                              isActive && "bg-primary text-primary-foreground"
                            )}
                          >
                            <Link to={item.href}>
                              <item.icon className="h-5 w-5" />
                              <span>{item.name}</span>
                            </Link>
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

        <div className="mt-auto border-t border-border p-2 space-y-1">
          {/* Public Website Link at bottom */}
          {user?.role === "admin" && (
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

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { schoolInfo } = useSchoolInfo();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      if (user?.role === "admin") {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user?.id)
          .maybeSingle();
        
        if (!error) {
          // Use profile data or fallback to user email
          setProfile({
            full_name: data?.full_name || user?.data?.email || "Admin User",
            avatar_url: data?.avatar_url || null,
          });
        } else {
          // Fallback if profile doesn't exist
          setProfile({
            full_name: user?.data?.email || "Admin User",
            avatar_url: null,
          });
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
      // Set fallback profile on error
      setProfile({
        full_name: user?.data?.email || "User",
        avatar_url: null,
      });
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
        <AppSidebar />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-6">
            <SidebarTrigger className="lg:hidden">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            
            {/* School Logo - visible on small screens */}
            <div className="flex lg:hidden items-center gap-2">
              {schoolInfo?.logo_url ? (
                <img src={schoolInfo.logo_url} alt="School Logo" className="h-8 w-8 object-contain rounded-full" />
              ) : (
                <GraduationCap className="h-8 w-8 text-primary" />
              )}
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
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
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

          <div className="flex-1 overflow-auto p-4 sm:p-6 pb-20 lg:pb-6">
            {children}
          </div>
          
          {/* Bottom Navigation - Mobile Only */}
          <BottomNavigation />
        </main>
        <OfflineIndicator />
      </div>
    </SidebarProvider>
  );
}

// Bottom Navigation Component for mobile
function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Only show for admin on small screens
  if (user?.role !== "admin") return null;
  
  const bottomNavItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Learners", href: "/learners", icon: Users },
    { name: "Fees", href: "/fees", icon: DollarSign },
    { name: "Performance", href: "/performance", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden h-16 items-center justify-around border-t border-border bg-card px-2">
      {bottomNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
