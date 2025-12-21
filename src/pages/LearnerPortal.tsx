import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, DollarSign, FileText, MessageSquare, Wallet, TrendingUp, AlertCircle, Filter, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

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
  
  // Performance filters
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [classPosition, setClassPosition] = useState<number | null>(null);

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
      fetchAcademicYears();
    }
  }, [learner]);

  useEffect(() => {
    if (learner && selectedYear && selectedTerm) {
      fetchPerformanceByFilter();
    }
  }, [learner, selectedYear, selectedTerm]);

  const fetchAcademicYears = async () => {
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .order("year", { ascending: false });
    
    if (data && data.length > 0) {
      setAcademicYears(data);
      const activeYear = data.find(y => y.is_active) || data[0];
      setSelectedYear(activeYear.year);
      setSelectedTerm("term_1" as const);
    }
  };

  const fetchPerformanceByFilter = async () => {
    if (!learner || !selectedYear || !selectedTerm) return;

    try {
      // Fetch performance records for selected year and term
      const { data: perfRecords } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code)
        `)
        .eq("learner_id", learner.id)
        .eq("academic_year", selectedYear)
        .eq("term", selectedTerm as "term_1" | "term_2" | "term_3")
        .order("learning_area_id");

      // Group by learning area with opener, midterm, final in same row
      const grouped = perfRecords?.reduce((acc: any, record: any) => {
        const areaName = record.learning_area?.name || "Unknown";
        if (!acc[areaName]) {
          acc[areaName] = {
            learning_area: areaName,
            opener: null,
            midterm: null,
            final: null,
            remarks: null,
          };
        }
        
        if (record.exam_type === "opener") {
          acc[areaName].opener = record.marks;
          if (record.remarks) acc[areaName].remarks = record.remarks;
        }
        if (record.exam_type === "midterm") {
          acc[areaName].midterm = record.marks;
          if (record.remarks) acc[areaName].remarks = record.remarks;
        }
        if (record.exam_type === "final") {
          acc[areaName].final = record.marks;
          if (record.remarks) acc[areaName].remarks = record.remarks;
        }
        
        return acc;
      }, {});

      const tableData = Object.values(grouped || {}).map((row: any) => {
        const scores = [row.opener, row.midterm, row.final].filter(s => s !== null);
        const average = scores.length > 0 
          ? Math.round((scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length) * 10) / 10
          : 0;
        return { ...row, average };
      });

      setPerformanceData(tableData);

      // Calculate class position
      if (learner.current_grade_id && learner.current_stream_id) {
        const { data: allLearners } = await supabase
          .from("learners")
          .select("id")
          .eq("current_grade_id", learner.current_grade_id)
          .eq("current_stream_id", learner.current_stream_id)
          .eq("status", "active");

        if (allLearners) {
          const averages = await Promise.all(
            allLearners.map(async (l) => {
              const { data: records } = await supabase
                .from("performance_records")
                .select("marks")
                .eq("learner_id", l.id)
                .eq("academic_year", selectedYear)
                .eq("term", selectedTerm as "term_1" | "term_2" | "term_3");

              const avg = records && records.length > 0
                ? records.reduce((sum, r) => sum + Number(r.marks), 0) / records.length
                : 0;

              return { learnerId: l.id, average: avg };
            })
          );

          averages.sort((a, b) => b.average - a.average);
          const position = averages.findIndex(a => a.learnerId === learner.id) + 1;
          setClassPosition(position > 0 ? position : null);
        }
      }

      // Prepare chart data
      const chartDataPoints = perfRecords?.map((record: any) => ({
        subject: record.learning_area?.code || record.learning_area?.name?.substring(0, 10) || "Unknown",
        marks: record.marks,
        examType: record.exam_type || "N/A"
      })) || [];

      setChartData(chartDataPoints);
    } catch (error: any) {
      console.error("Error fetching performance:", error);
    }
  };

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
          .maybeSingle();

        // Fetch all invoices for the learner
        const { data: invoices } = await supabase
          .from("student_invoices")
          .select("*")
          .eq("learner_id", learner.id)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false });

        // Fetch all fee transactions
        const { data: transactions } = await supabase
          .from("fee_transactions")
          .select("*")
          .eq("learner_id", learner.id)
          .order("payment_date", { ascending: false });

        // Fetch all legacy fee payments
        const { data: legacyPayments } = await supabase
          .from("fee_payments")
          .select("*")
          .eq("learner_id", learner.id)
          .order("payment_date", { ascending: false });

        // Calculate total fees (considering discounts)
        const totalFees = invoices?.reduce((sum, inv) => {
          const invoiceAmount = Number(inv.total_amount) - Number(inv.discount_amount || 0);
          return sum + invoiceAmount;
        }, 0) || 0;

        // Calculate total paid from both transaction sources
        const transactionsPaid = transactions?.reduce((sum, txn) => sum + Number(txn.amount_paid), 0) || 0;
        const legacyPaid = legacyPayments?.reduce((sum, pmt) => sum + Number(pmt.amount_paid), 0) || 0;
        const totalPaid = transactionsPaid + legacyPaid;

        // Calculate balance
        const balance = Math.max(0, totalFees - totalPaid);

        // Combine all payments for display
        const allPayments = [
          ...(transactions || []).map(txn => ({
            id: txn.id,
            amount_paid: txn.amount_paid,
            payment_date: txn.payment_date,
            payment_method: txn.payment_method,
            receipt_number: txn.receipt_number || txn.transaction_number,
            type: 'transaction'
          })),
          ...(legacyPayments || []).map(pmt => ({
            id: pmt.id,
            amount_paid: pmt.amount_paid,
            payment_date: pmt.payment_date,
            payment_method: pmt.payment_method || 'Payment',
            receipt_number: pmt.receipt_number,
            type: 'legacy'
          }))
        ].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

        setFeeInfo({
          totalExpected: totalFees,
          totalPaid,
          balance,
          payments: allPayments,
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
    if (marks >= 80) return "bg-primary/10 text-primary";
    if (marks >= 60) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (marks >= 50) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-destructive/10 text-destructive";
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
    <div className="px-1 py-2 sm:py-4">
      <Tabs value={getActiveTab()} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="performance" className="flex items-center justify-center gap-1 md:gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Perf.</span>
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center justify-center gap-1 md:gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Fees</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center justify-center gap-1 md:gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center justify-center gap-1 md:gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
            <span className="sm:hidden">Msgs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Performance Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.year}>
                          {year.year} {year.is_active && "(Current)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Visual representation of your marks</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="linear" dataKey="marks" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data for selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Performance Records - {selectedYear} {getTermLabel(selectedTerm)}
                {classPosition && (
                  <Badge className="ml-2" variant="secondary">
                    Class Position: {classPosition}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Academic performance by learning area</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Learning Area</TableHead>
                        <TableHead className="text-center">Opener</TableHead>
                        <TableHead className="text-center">Midterm</TableHead>
                        <TableHead className="text-center">Final</TableHead>
                        <TableHead className="text-center font-semibold">Average</TableHead>
                        <TableHead className="hidden md:table-cell">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.learning_area}</TableCell>
                          <TableCell className="text-center">
                            {row.opener !== null ? (
                              <Badge className={getGradeColor(row.opener)}>{row.opener}%</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {row.midterm !== null ? (
                              <Badge className={getGradeColor(row.midterm)}>{row.midterm}%</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {row.final !== null ? (
                              <Badge className={getGradeColor(row.final)}>{row.final}%</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default" className={getGradeColor(row.average)}>
                              {row.average.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {row.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance records found for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          {/* Fees Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(feeInfo?.totalExpected || 0)}</div>
                <p className="text-xs text-muted-foreground">Accumulated fees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(feeInfo?.totalPaid || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total payments made</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(feeInfo?.balance || 0) > 0 ? 'text-destructive' : 'text-primary'}`}>
                  {formatCurrency(feeInfo?.balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Amount remaining</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
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
                        <div className="font-semibold">{formatCurrency(Number(payment.amount_paid))}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                        </div>
                        {payment.receipt_number && (
                          <div className="text-xs text-muted-foreground">Receipt: {payment.receipt_number}</div>
                        )}
                      </div>
                      <Badge variant="outline">
                        {payment.payment_method || 'Payment'}
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
