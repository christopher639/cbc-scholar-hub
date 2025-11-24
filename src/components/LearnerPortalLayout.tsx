import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Settings, GraduationCap, Home, BookOpen, DollarSign, Search, FileText, MessageSquare, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LearnerChangePasswordDialog } from "@/components/LearnerChangePasswordDialog";

export default function LearnerPortalLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [learnerDetails, setLearnerDetails] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const isLearner = user?.role === "learner";
  const learner = isLearner ? user.data : null;
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isLearner) {
      navigate("/auth", { replace: true });
    } else if (isLearner && learner) {
      fetchData();
    }
  }, [authLoading, isLearner, learner, navigate]);

  const fetchData = async () => {
    if (!learner) return;

    try {
      setLoading(true);

      const { data: learnerData, error: learnerError } = await supabase
        .from("learners")
        .select(`
          *,
          current_grade:grades(name),
          current_stream:streams(name)
        `)
        .eq("id", learner.id)
        .maybeSingle();

      if (learnerError) {
        console.error("Error fetching learner details:", learnerError);
        toast({
          title: "Error",
          description: "Could not load learner details. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }

      if (!learnerData) {
        toast({
          title: "Error",
          description: "Learner profile not found. Please contact administration.",
          variant: "destructive",
        });
        return;
      }

      setLearnerDetails(learnerData);

      const { data: schoolData } = await supabase
        .from("school_info")
        .select("*")
        .single();

      setSchoolInfo(schoolData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-96" />
        </div>
      </div>
    );
  }

  if (!isLearner || !learnerDetails) {
    return null;
  }

  const navigationItems = [
    { title: "Dashboard", url: "/learner-portal", icon: Home },
    { title: "Profile", url: "/learner-portal/profile", icon: UserCircle },
    { title: "Performance", url: "/learner-portal/performance", icon: BookOpen },
    { title: "My Fees", url: "/learner-portal/fees", icon: DollarSign },
    { title: "Fee Structures", url: "/learner-portal/fee-structures", icon: Search },
    { title: "Settings", url: "/learner-portal/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/learner-portal") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (url: string) => {
    setIsNavigating(true);
    // Small delay to show loading state, then navigate
    setTimeout(() => {
      navigate(url);
      setIsNavigating(false);
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/30 bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          {/* Left - School Logo */}
          <div className="flex items-center gap-2 md:gap-4">
            {schoolInfo?.logo_url ? (
              <img src={schoolInfo.logo_url} alt="School Logo" className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-primary/20">
                <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xs sm:text-sm md:text-base font-bold leading-tight text-foreground">{schoolInfo?.school_name || "School Portal"}</h1>
              <p className="text-xs text-muted-foreground hidden md:block">{schoolInfo?.motto || "Learner Portal"}</p>
            </div>
          </div>

          {/* Right - User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 hover:bg-transparent">
                <Avatar className="h-9 w-9 md:h-10 md:w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <AvatarImage src={learnerDetails.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-xs md:text-sm">
                    {learnerDetails.first_name[0]}{learnerDetails.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{learnerDetails.first_name} {learnerDetails.last_name}</p>
                  <p className="text-xs text-muted-foreground">Admission: {learnerDetails.admission_number}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/learner-portal")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                View Profile
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

        {/* Desktop Navigation - Below Header */}
        <nav className="hidden md:flex items-center w-full gap-2 px-6 pb-2 overflow-x-auto border-t border-border/30">
          <div className="flex items-center justify-between w-full gap-2">
            {navigationItems.map((item) => (
              <Button
                key={item.url}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate(item.url)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap transition-all rounded-lg px-3 py-2",
                  isActive(item.url) 
                    ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90" 
                    : "hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.title}</span>
              </Button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content - with top padding for fixed header */}
      <main className="flex-1 mt-14 md:mt-[88px] mb-16 md:mb-0 overflow-auto relative">
        <div className={cn("transition-opacity duration-200", isNavigating && "opacity-50 pointer-events-none")}>
          <Outlet context={{ learnerDetails, schoolInfo, refetch: fetchData }} />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30 bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => (
            <Button
              key={item.url}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(item.url)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-lg transition-all",
                isActive(item.url) 
                  ? "text-primary bg-primary/10 font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive(item.url) && "scale-110")} />
            </Button>
          ))}
        </div>
      </nav>

      {/* Password Change Dialog */}
      {learnerDetails && (
        <LearnerChangePasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          learnerId={learnerDetails.id}
        />
      )}
    </div>
  );
}
