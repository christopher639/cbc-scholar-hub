import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, DollarSign, TrendingUp, FileText, Calendar, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function LearnerDashboard() {
  const { learnerDetails } = useOutletContext<any>();
  const { user } = useAuth();
  const learner = user?.data;
  const { currentPeriod } = useAcademicPeriods();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    totalSubjects: 0,
    averageScore: 0,
    feeBalance: 0,
  });
  const [performance, setPerformance] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [feeInfo, setFeeInfo] = useState({
    totalAccumulatedFees: 0,
    totalPaid: 0,
    totalBalance: 0,
    currentTermFees: 0,
    currentTermPaid: 0,
    currentTermBalance: 0,
  });

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");

  useEffect(() => {
    if (learner) {
      fetchStats();
    }
  }, [learner]);

  // Set default filters when current period loads
  useEffect(() => {
    if (currentPeriod && !selectedYear) {
      setSelectedYear(currentPeriod.academic_year);
      setSelectedTerm(currentPeriod.term);
    }
  }, [currentPeriod]);

  const fetchStats = async () => {
    if (!learner) return;

    // Fetch performance records with details
    const { data: performanceData } = await supabase
      .from("performance_records")
      .select(`
        *,
        learning_area:learning_areas(name),
        academic_period:academic_periods(academic_year, term)
      `)
      .eq("learner_id", learner.id)
      .order("created_at", { ascending: false });

    setPerformance(performanceData || []);

    // Fetch invoices with details
    const { data: invoicesData } = await supabase
      .from("student_invoices")
      .select("*")
      .eq("learner_id", learner.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    setInvoices(invoicesData || []);

    // Fetch transactions
    const { data: transactionsData } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("learner_id", learner.id)
      .order("payment_date", { ascending: false });

    setTransactions(transactionsData || []);

    // Calculate stats
    const avgScore = performanceData?.length
      ? performanceData.reduce((sum, p) => sum + Number(p.marks), 0) / performanceData.length
      : 0;

    const totalAccumulated = invoicesData?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
    const totalPaid = transactionsData?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;
    const totalBalance = invoicesData?.reduce((sum, inv) => sum + Number(inv.balance_due), 0) || 0;

    // Get current academic period
    const { data: currentPeriod } = await supabase
      .from("academic_periods")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();

    let currentTermFees = 0;
    let currentTermPaid = 0;
    if (currentPeriod && invoicesData) {
      const currentInvoice = invoicesData.find(
        inv => inv.academic_year === currentPeriod.academic_year && inv.term === currentPeriod.term
      );
      if (currentInvoice) {
        currentTermFees = Number(currentInvoice.total_amount);
        currentTermPaid = Number(currentInvoice.amount_paid);
      }
    }

    // Count unique learning areas
    const subjectCount = performanceData 
      ? new Set(performanceData.map(p => p.learning_area_id)).size 
      : 0;

    setStats({
      totalSubjects: subjectCount,
      averageScore: Math.round(avgScore),
      feeBalance: totalBalance,
    });

    setFeeInfo({
      totalAccumulatedFees: totalAccumulated,
      totalPaid,
      totalBalance,
      currentTermFees,
      currentTermPaid,
      currentTermBalance: currentTermFees - currentTermPaid,
    });
  };

  // Filter performance data
  const filteredPerformance = performance.filter(record => {
    if (selectedYear && record.academic_year !== selectedYear) return false;
    if (selectedTerm && record.term !== selectedTerm) return false;
    if (selectedExamType !== "all" && record.exam_type !== selectedExamType) return false;
    return true;
  });

  // Prepare chart data
  const chartData = filteredPerformance.reduce((acc: any[], record) => {
    const areaName = record.learning_area?.name || "Unknown";
    const existing = acc.find(item => item.area === areaName);
    
    if (existing) {
      existing.marks = Math.max(existing.marks, record.marks);
    } else {
      acc.push({
        area: areaName,
        marks: record.marks
      });
    }
    return acc;
  }, []);

  // Get unique values for filters
  const uniqueYears = [...new Set(performance.map(p => p.academic_year))].filter(Boolean);
  const uniqueTerms = [...new Set(performance.map(p => p.term))].filter(Boolean);
  const uniqueExamTypes = [...new Set(performance.map(p => p.exam_type))].filter(Boolean);

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 80) return "bg-green-100 text-green-800";
    if (marks >= 70) return "bg-blue-100 text-blue-800";
    if (marks >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const handleDownloadReportCard = () => {
    if (filteredPerformance.length === 0) {
      toast({
        title: "No Data",
        description: "No performance records available to generate report",
        variant: "destructive",
      });
      return;
    }
    
    // Trigger the PrintablePerformanceReport download
    const printButton = document.querySelector('[data-print-report]') as HTMLButtonElement;
    if (printButton) {
      printButton.click();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={learnerDetails?.photo_url} alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} />
              <AvatarFallback className="text-3xl">
                {learnerDetails?.first_name?.[0]}{learnerDetails?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {learnerDetails?.first_name} {learnerDetails?.last_name}
                </h1>
                <p className="text-muted-foreground">Admission No: {learnerDetails?.admission_number}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-base">
                  {learnerDetails?.current_grade?.name} {learnerDetails?.current_stream?.name}
                </Badge>
                <Badge className="text-base">Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Born: {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"} ({learnerDetails?.date_of_birth ? calculateAge(learnerDetails.date_of_birth) : 0} years)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="capitalize">{learnerDetails?.gender}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Enrolled: {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              From {stats.totalSubjects} subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Accumulated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(feeInfo.totalAccumulatedFees)}</div>
            <p className="text-xs text-muted-foreground mt-2">Total fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(feeInfo.totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-2">{transactions.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(feeInfo.totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-2">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList className="grid grid-cols-3 lg:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>
          <Button onClick={handleDownloadReportCard} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Report Card
          </Button>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base font-medium">{learnerDetails?.first_name} {learnerDetails?.last_name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-base font-medium">
                    {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="text-base font-medium capitalize">{learnerDetails?.gender}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                  <p className="text-base font-medium">{learnerDetails?.admission_number}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Grade</p>
                  <p className="text-base font-medium">{learnerDetails?.current_grade?.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Stream</p>
                  <p className="text-base font-medium">{learnerDetails?.current_stream?.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Boarding Status</p>
                  <p className="text-base font-medium capitalize">
                    {learnerDetails?.boarding_status?.replace("_", " ")}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
                  <p className="text-base font-medium">
                    {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {(learnerDetails?.emergency_contact || learnerDetails?.emergency_phone) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                        <p className="text-base font-medium">{learnerDetails?.emergency_contact || "Not set"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                        <p className="text-base font-medium">{learnerDetails?.emergency_phone || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>Filter and view your assessment results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTerms.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term.replace("term_", "Term ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Exam Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {uniqueExamTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div data-print-report>
                  <PrintablePerformanceReport
                    learner={learnerDetails}
                    performance={filteredPerformance}
                    academicYear={selectedYear}
                    term={selectedTerm}
                    examType={selectedExamType !== "all" ? selectedExamType : undefined}
                  />
                </div>
              </div>

              {filteredPerformance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No performance records for selected filters</p>
              ) : (
                <>
                  {/* Performance Chart */}
                  {chartData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="area" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="marks" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              name="Marks"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Performance Records */}
                  <div className="space-y-3">
                    {filteredPerformance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{record.learning_area?.name}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{record.academic_period?.academic_year || record.academic_year}</span>
                            {(record.academic_period?.term || record.term) && (
                              <span>• {(record.academic_period?.term || record.term).replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                            )}
                            {record.exam_type && <span>• {record.exam_type}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-base ${getGradeColor(record.marks)}`}>
                              {record.grade_letter || 'N/A'}
                            </Badge>
                            <span className="text-2xl font-bold">{record.marks}%</span>
                          </div>
                          {record.remarks && (
                            <p className="text-xs text-muted-foreground mt-1">{record.remarks}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          {/* Fee Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Fee Summary
              </CardTitle>
              <CardDescription>Your complete fee information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm text-muted-foreground mb-1">Total Fees</p>
                  <p className="text-2xl font-bold">{formatCurrency(feeInfo.totalAccumulatedFees)}</p>
                  <p className="text-xs text-muted-foreground mt-1">From {invoices.length} invoices</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(feeInfo.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{transactions.length} payments</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm text-muted-foreground mb-1">Balance Due</p>
                  <p className={`text-2xl font-bold ${feeInfo.totalBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(feeInfo.totalBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Term Fees */}
          <Card>
            <CardHeader>
              <CardTitle>Current Term Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Term Fees</p>
                  <p className="text-xl font-bold">{formatCurrency(feeInfo.currentTermFees)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(feeInfo.currentTermPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className={`text-xl font-bold ${feeInfo.currentTermBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(feeInfo.currentTermBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No invoices found</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <div className="text-sm text-muted-foreground">
                          <span>{invoice.academic_year}</span>
                          <span> • {invoice.term.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold">{formatCurrency(invoice.balance_due)}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'partial' ? 'secondary' :
                          invoice.status === 'overdue' ? 'destructive' : 'outline'
                        }>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.transaction_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.payment_date).toLocaleDateString()} • {transaction.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">{formatCurrency(transaction.amount_paid)}</p>
                        {transaction.reference_number && (
                          <p className="text-xs text-muted-foreground">Ref: {transaction.reference_number}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
