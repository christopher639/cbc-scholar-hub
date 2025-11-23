import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, DollarSign, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function LearnerPortal() {
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const learner = user?.data;
  const [performance, setPerformance] = useState<any[]>([]);
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getActiveTab = () => {
    if (location.pathname.includes("/performance")) return "performance";
    if (location.pathname.includes("/fees")) return "fees";
    if (location.pathname.includes("/assignments")) return "assignments";
    if (location.pathname.includes("/messages")) return "messages";
    return "performance";
  };

  useEffect(() => {
    if (learner) {
      fetchData();
    }
  }, [learner]);

  const fetchData = async () => {
    if (!learner) return;

    try {
      setLoading(true);

      // Fetch performance records using learner_id
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
        // Get current academic period
        const { data: currentPeriod } = await supabase
          .from("academic_periods")
          .select("*")
          .eq("is_current", true)
          .single();

        // Fetch invoices for the learner
        const { data: invoices } = await supabase
          .from("student_invoices")
          .select("*")
          .eq("learner_id", learner.id)
          .order("created_at", { ascending: false });

        // Fetch transactions for the learner
        const { data: transactions } = await supabase
          .from("fee_transactions")
          .select("*")
          .eq("learner_id", learner.id)
          .order("payment_date", { ascending: false });

        const totalExpected = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
        const totalPaid = transactions?.reduce((sum, txn) => sum + Number(txn.amount_paid), 0) || 0;
        const balance = Math.max(0, totalExpected - totalPaid);

        setFeeInfo({
          totalExpected,
          totalPaid,
          balance,
          payments: transactions || [],
        });
      }

      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setMessages(messagesData || []);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={getActiveTab()} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">
            <BookOpen className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="h-4 w-4 mr-2" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FileText className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>Your recent exam results</CardDescription>
            </CardHeader>
            <CardContent>
              {performance.length > 0 ? (
                <div className="space-y-4">
                  {performance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                            <Badge className={getGradeColor(record.marks)}>{record.grade_letter}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No performance records yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">KES {Number(payment.amount_paid).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                        </div>
                        {payment.receipt_number && (
                          <div className="text-xs text-muted-foreground">Receipt: {payment.receipt_number}</div>
                        )}
                      </div>
                      <Badge variant={payment.status === "paid" ? "default" : payment.status === "partial" ? "secondary" : "destructive"}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No payment records yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Holiday Assignments</CardTitle>
              <CardDescription>Assignments to complete</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">Holiday Assignment</h3>
                          <p className="text-xs text-muted-foreground">
                            Posted: {format(new Date(assignment.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <Badge variant={assignment.is_read ? "secondary" : "default"}>
                          {assignment.is_read ? "Viewed" : "New"}
                        </Badge>
                      </div>
                      <p className="text-sm">{assignment.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No assignments yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages & Announcements</CardTitle>
              <CardDescription>Communications from teachers</CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`p-4 border rounded-lg ${!message.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{message.sender_type}</Badge>
                          {!message.is_read && <Badge variant="default" className="text-xs">New</Badge>}
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
                <div className="text-center py-8 text-muted-foreground">No messages yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
