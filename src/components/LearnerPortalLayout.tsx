import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/LearnerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Settings, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnerPortalLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [learnerDetails, setLearnerDetails] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isLearner = user?.role === "learner";
  const learner = isLearner ? user.data : null;

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <LearnerSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 md:h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2 md:gap-3">
                  {schoolInfo?.logo_url ? (
                    <img src={schoolInfo.logo_url} alt="School Logo" className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <h1 className="text-sm md:text-lg font-bold">{schoolInfo?.school_name || "School Portal"}</h1>
                    <p className="text-xs text-muted-foreground hidden md:block">{schoolInfo?.motto || "Learner Portal"}</p>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10 cursor-pointer ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
                      <AvatarImage src={learnerDetails.photo_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs md:text-sm">
                        {learnerDetails.first_name[0]}{learnerDetails.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{learnerDetails.first_name} {learnerDetails.last_name}</p>
                      <p className="text-xs text-muted-foreground">Adm: {learnerDetails.admission_number}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/learner-portal")}>
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet context={{ learnerDetails, schoolInfo, refetch: fetchData }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
