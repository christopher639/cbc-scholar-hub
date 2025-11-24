import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, DollarSign, TrendingUp, FileText, Calendar, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

// Helper function to group performance by learning area
const groupPerformanceByArea = (records: any[]) => {
  const grouped = records.reduce((acc: any, record) => {
    const areaName = record.learning_area?.name || "Unknown";
    if (!acc[areaName]) {
      acc[areaName] = {
        area: areaName,
        opener: null,
        midterm: null,
        final: null,
        grades: { opener: null, midterm: null, final: null },
        remarks: { opener: null, midterm: null, final: null }
      };
    }
    
    const examType = record.exam_type?.toLowerCase();
    if (examType === "opener") {
      acc[areaName].opener = record.marks;
      acc[areaName].grades.opener = record.grade_letter;
      acc[areaName].remarks.opener = record.remarks;
    } else if (examType === "mid-term" || examType === "midterm") {
      acc[areaName].midterm = record.marks;
      acc[areaName].grades.midterm = record.grade_letter;
      acc[areaName].remarks.midterm = record.remarks;
    } else if (examType === "final") {
      acc[areaName].final = record.marks;
      acc[areaName].grades.final = record.grade_letter;
      acc[areaName].remarks.final = record.remarks;
    }
    
    return acc;
  }, {});
  
  return Object.values(grouped).map((area: any) => {
    const scores = [area.opener, area.midterm, area.final].filter(s => s !== null);
    const average = scores.length > 0 
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length 
      : null;
    
    return {
      ...area,
      average: average !== null ? Math.round(average) : null
    };
  });
};

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
      .select(`
        *,
        invoice:student_invoices(invoice_number, academic_year, term)
      `)
      .eq("learner_id", learner.id)
      .order("payment_date", { ascending: false });

    setTransactions(transactionsData || []);

    // Fetch fee_payments (legacy payment system)
    const { data: feePaymentsData } = await supabase
      .from("fee_payments")
      .select(`
        *,
        fee_structure:fee_structures(academic_year, term)
      `)
      .eq("learner_id", learner.id)
      .order("payment_date", { ascending: false });

    // Calculate stats
    const avgScore = performanceData?.length
      ? performanceData.reduce((sum, p) => sum + Number(p.marks), 0) / performanceData.length
      : 0;

    const totalAccumulated = invoicesData?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
    
    // Calculate total paid from BOTH fee_transactions and fee_payments
    const totalPaidFromTransactions = transactionsData?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;
    const totalPaidFromFeePayments = feePaymentsData?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
    const totalPaid = totalPaidFromTransactions + totalPaidFromFeePayments;
    
    const totalBalance = totalAccumulated - totalPaid;

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
        
        // Calculate current term paid from actual transactions for this term
        const currentTermTransactions = transactionsData?.filter(
          t => t.invoice?.academic_year === currentPeriod.academic_year &&
               t.invoice?.term === currentPeriod.term
        ) || [];
        
        const currentTermFeePayments = feePaymentsData?.filter(
          p => p.fee_structure?.academic_year === currentPeriod.academic_year &&
               p.fee_structure?.term === currentPeriod.term
        ) || [];
        
        currentTermPaid = 
          currentTermTransactions.reduce((sum, t) => sum + Number(t.amount_paid), 0) +
          currentTermFeePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
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

  // Group performance by learning area
  const groupedPerformance = groupPerformanceByArea(filteredPerformance);

  // Prepare chart data - use average scores per area
  const chartData = groupedPerformance.map(area => ({
    area: area.area,
    marks: area.average || 0
  }));

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
    <div className="w-full min-h-screen px-3 md:px-6 py-4 md:py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 mx-auto md:mx-0">
              <AvatarImage src={learnerDetails?.photo_url} alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} />
              <AvatarFallback className="text-2xl md:text-3xl">
                {learnerDetails?.first_name?.[0]}{learnerDetails?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {learnerDetails?.first_name} {learnerDetails?.last_name}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">Admission No: {learnerDetails?.admission_number}</p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="text-sm">
                  {learnerDetails?.current_grade?.name} {learnerDetails?.current_stream?.name}
                </Badge>
                <Badge className="text-sm">Active</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Born: {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"} ({learnerDetails?.date_of_birth ? calculateAge(learnerDetails.date_of_birth) : 0} yrs)</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="capitalize">{learnerDetails?.gender}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Enrolled: {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <CardTitle className="text-xl">Academic Performance</CardTitle>
              <CardDescription className="text-sm mt-1">
                {selectedYear && selectedTerm 
                  ? `${selectedYear} - ${selectedTerm.replace("term_", "Term ")}`
                  : "Filter to view performance"}
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button onClick={handleDownloadReportCard} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div data-print-report className="hidden">
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
            <p className="text-center text-muted-foreground py-8 text-sm">No performance records for selected filters</p>
          ) : (
            <>
              {/* Performance Overview Graph */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader className="pb-6">
                    <CardTitle className="text-lg">Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
                      <div className="min-w-[500px]">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="area" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="linear" 
                              dataKey="marks" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              name="Average Marks"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Table */}
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold whitespace-nowrap">Learning Area</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap">Opener</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap">Mid-Term</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap">Final</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap">Average</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPerformance.map((area, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{area.area}</TableCell>
                        <TableCell className="text-center">
                          {area.opener !== null ? (
                            <div className="space-y-1">
                              <Badge className={`${getGradeColor(area.opener)}`}>
                                {area.opener}
                              </Badge>
                              {area.grades.opener && (
                                <div className="text-xs text-muted-foreground">{area.grades.opener}</div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {area.midterm !== null ? (
                            <div className="space-y-1">
                              <Badge className={`${getGradeColor(area.midterm)}`}>
                                {area.midterm}
                              </Badge>
                              {area.grades.midterm && (
                                <div className="text-xs text-muted-foreground">{area.grades.midterm}</div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {area.final !== null ? (
                            <div className="space-y-1">
                              <Badge className={`${getGradeColor(area.final)}`}>
                                {area.final}
                              </Badge>
                              {area.grades.final && (
                                <div className="text-xs text-muted-foreground">{area.grades.final}</div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {area.average !== null ? (
                            <Badge className={`${getGradeColor(area.average)} font-bold`}>
                              {area.average}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {area.remarks.opener && <div>O: {area.remarks.opener}</div>}
                            {area.remarks.midterm && <div>M: {area.remarks.midterm}</div>}
                            {area.remarks.final && <div>F: {area.remarks.final}</div>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
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
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base font-medium">
                    {learnerDetails?.first_name} {learnerDetails?.last_name}
                  </p>
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
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          {/* Fee Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Fee Summary
              </CardTitle>
              <CardDescription>Your complete fee information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <CardHeader className="pb-6">
              <CardTitle className="text-lg">Current Term Fees</CardTitle>
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
            <CardHeader className="pb-6">
              <CardTitle className="text-lg">Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No invoices found</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-base">{invoice.invoice_number}</p>
                        <div className="text-sm text-muted-foreground">
                          <span>{invoice.academic_year}</span>
                          <span> • {invoice.term.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <p className="font-bold text-base">{formatCurrency(invoice.balance_due)}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'partial' ? 'secondary' :
                          invoice.status === 'overdue' ? 'destructive' : 'outline'
                        } className="text-xs">
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
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No payments recorded</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-0">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium text-sm sm:text-base">{transaction.transaction_number}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(transaction.payment_date).toLocaleDateString()} • {transaction.payment_method}
                        </p>
                      </div>
                      <div className="w-full sm:w-auto text-left sm:text-right">
                        <p className="font-bold text-success text-sm sm:text-base">{formatCurrency(transaction.amount_paid)}</p>
                        {transaction.reference_number && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Ref: {transaction.reference_number}</p>
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
