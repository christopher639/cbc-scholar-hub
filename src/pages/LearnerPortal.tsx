import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User, BookOpen, DollarSign, GraduationCap, Settings, MessageSquare, FileText } from "lucide-react";
import { format } from "date-fns";
import { LearnerChangePasswordDialog } from "@/components/LearnerChangePasswordDialog";
import { LearnerEditProfileDialog } from "@/components/LearnerEditProfileDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function LearnerPortal() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [performance, setPerformance] = useState<any[]>([]);
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [learnerDetails, setLearnerDetails] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
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

      // Fetch learner details with grade and stream info
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

      // Fetch performance records
      const { data: perfData } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          academic_period:academic_periods(academic_year, term)
        `)
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setPerformance(perfData || []);

      // Fetch fee information
      if (learner.current_grade_id) {
        const { data: feeStructures } = await supabase
          .from("fee_structures")
          .select("*")
          .eq("grade_id", learner.current_grade_id);

        const { data: payments } = await supabase
          .from("fee_payments")
          .select("*")
          .eq("learner_id", learner.id)
          .order("payment_date", { ascending: false });

        const totalExpected = feeStructures?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
        const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
        const balance = Math.max(0, totalExpected - totalPaid);

        setFeeInfo({
          totalExpected,
          totalPaid,
          balance,
          payments: payments || [],
        });
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setMessages(messagesData || []);

      // Fetch school info
      const { data: schoolData } = await supabase
        .from("school_info")
        .select("*")
        .single();

      setSchoolInfo(schoolData);

      // Fetch assignments (using messages with assignment type)
      const { data: assignmentsData } = await supabase
        .from("messages")
        .select("*")
        .eq("learner_id", learner.id)
        .eq("sender_type", "assignment")
        .order("created_at", { ascending: false })
        .limit(20);

      setAssignments(assignmentsData || []);
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

  const getTermLabel = (term: string) => {
    const termMap: Record<string, string> = {
      term_1: "Term 1",
      term_2: "Term 2",
      term_3: "Term 3",
    };
    return termMap[term] || term;
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (marks >= 60) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (marks >= 50) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* School Logo */}
            <div className="flex items-center gap-3">
              {schoolInfo?.logo_url ? (
                <img src={schoolInfo.logo_url} alt="School Logo" className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold">{schoolInfo?.school_name || "School Portal"}</h1>
                <p className="text-xs text-muted-foreground">{schoolInfo?.motto || "Learner Portal"}</p>
              </div>
            </div>

            {/* Learner Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full">
                  <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
                    <AvatarImage src={learnerDetails.photo_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
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
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Grade:</span>{" "}
                  <span className="font-medium">{learnerDetails.current_grade?.name}</span>
                </div>
                {learnerDetails.current_stream && (
                  <div>
                    <span className="text-muted-foreground">Stream:</span>{" "}
                    <span className="font-medium">{learnerDetails.current_stream?.name}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Gender:</span>{" "}
                  <span className="font-medium capitalize">{learnerDetails.gender}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fees Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fee Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {feeInfo ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-medium">KES {feeInfo.totalExpected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-medium text-green-600">KES {feeInfo.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-bold">KES {feeInfo.balance.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No fee information available</p>
              )}
            </CardContent>
          </Card>

          {/* Academic Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Academic Info</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Enrollment:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(learnerDetails.enrollment_date), "MMM dd, yyyy")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">DOB:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(learnerDetails.date_of_birth), "MMM dd, yyyy")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Records:</span>{" "}
                  <span className="font-medium">{performance.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Fee Payments
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <FileText className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
                <CardDescription>Your recent exam results and grades</CardDescription>
              </CardHeader>
              <CardContent>
                {performance.length > 0 ? (
                  <div className="space-y-4">
                    {performance.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{record.learning_area?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.academic_period?.academic_year} - {getTermLabel(record.academic_period?.term)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{record.marks}</div>
                            {record.grade_letter && (
                              <Badge className={getGradeColor(record.marks)}>
                                {record.grade_letter}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No performance records available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All your fee payments</CardDescription>
              </CardHeader>
              <CardContent>
                {feeInfo?.payments.length > 0 ? (
                  <div className="space-y-4">
                    {feeInfo.payments.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-semibold">
                            KES {Number(payment.amount_paid).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                          </div>
                          {payment.receipt_number && (
                            <div className="text-xs text-muted-foreground">
                              Receipt: {payment.receipt_number}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={
                            payment.status === "paid"
                              ? "default"
                              : payment.status === "partial"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment records available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holiday Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Holiday Assignments</CardTitle>
                <CardDescription>Assignments to complete during school breaks</CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Holiday Assignment</h3>
                              <p className="text-xs text-muted-foreground">
                                Posted: {format(new Date(assignment.created_at), "MMM dd, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge variant={assignment.is_read ? "secondary" : "default"}>
                            {assignment.is_read ? "Viewed" : "New"}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{assignment.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">No holiday assignments yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check back during school breaks for assignments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages & Announcements</CardTitle>
                <CardDescription>Communications from teachers and administration</CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 border rounded-lg ${
                          !message.is_read ? "bg-primary/5 border-primary/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {message.sender_type}
                            </Badge>
                            {!message.is_read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), "MMM dd, yyyy")}
                          </div>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <LearnerChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        learnerId={learner?.id || ""}
      />
      <LearnerEditProfileDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        learner={learnerDetails}
        onSuccess={fetchData}
      />
    </div>
  );
}
