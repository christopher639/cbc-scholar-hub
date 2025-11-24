import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, DollarSign, TrendingUp, FileText, Calendar, Download, Printer, BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";

// Helper function to group performance by learning area with deviation calculation
const groupPerformanceByArea = (records: any[], allRecords: any[], currentYear: string, currentTerm: string) => {
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
  
  // Calculate previous term average for each learning area
  const getPreviousTerm = (term: string) => {
    if (term === "term_3") return "term_2";
    if (term === "term_2") return "term_1";
    return null;
  };
  
  const previousTerm = getPreviousTerm(currentTerm);
  const previousTermRecords = previousTerm 
    ? allRecords.filter(r => r.academic_year === currentYear && r.term === previousTerm)
    : [];
  
  const previousAverages: Record<string, { total: number; count: number }> = {};
  previousTermRecords.forEach(record => {
    const areaName = record.learning_area?.name || "Unknown";
    if (!previousAverages[areaName]) {
      previousAverages[areaName] = { total: 0, count: 0 };
    }
    previousAverages[areaName].total += Number(record.marks);
    previousAverages[areaName].count += 1;
  });
  
  const finalPreviousAverages: Record<string, number> = {};
  Object.keys(previousAverages).forEach(area => {
    finalPreviousAverages[area] = previousAverages[area].total / previousAverages[area].count;
  });
  
  return Object.values(grouped).map((area: any) => {
    const scores = [area.opener, area.midterm, area.final].filter(s => s !== null);
    const average = scores.length > 0 
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length 
      : null;
    
    const previousAverage = finalPreviousAverages[area.area];
    const deviation = average !== null && previousAverage 
      ? Math.round((average - previousAverage) * 10) / 10 
      : null;
    
    return {
      ...area,
      average: average !== null ? Math.round(average) : null,
      deviation,
      previousAverage: previousAverage ? Math.round(previousAverage) : null
    };
  });
};

export default function LearnerDashboard() {
  const { learnerDetails } = useOutletContext<any>();
  const { user } = useAuth();
  const learner = user?.data;
  const { currentPeriod } = useAcademicPeriods();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
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
  const [showComparison, setShowComparison] = useState(false);

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

  // Get unique values for filters (moved before chart calculations to avoid reference errors)
  const uniqueYears = [...new Set(performance.map(p => p.academic_year))].filter(Boolean);
  const uniqueTerms = [...new Set(performance.map(p => p.term))].filter(Boolean);
  const uniqueExamTypes = [...new Set(performance.map(p => p.exam_type))].filter(Boolean);

  // Group performance by learning area
  const groupedPerformance = groupPerformanceByArea(filteredPerformance, performance, selectedYear, selectedTerm);

  // Prepare chart data - use average scores per area
  const chartData = groupedPerformance.map(area => ({
    area: area.area,
    marks: area.average || 0
  }));

  // Prepare comparison data (all years)
  const comparisonChartData = (() => {
    const yearsByArea: any = {};
    
    performance.forEach(record => {
      const areaName = record.learning_area?.name || "Unknown";
      const year = record.academic_year;
      
      if (!yearsByArea[areaName]) {
        yearsByArea[areaName] = { area: areaName };
      }
      
      if (!yearsByArea[areaName][year]) {
        yearsByArea[areaName][year] = { total: 0, count: 0 };
      }
      
      yearsByArea[areaName][year].total += Number(record.marks) || 0;
      yearsByArea[areaName][year].count += 1;
    });
    
    return Object.values(yearsByArea).map((area: any) => {
      const result: any = { area: area.area };
      uniqueYears.forEach(year => {
        if (area[year]) {
          result[year] = Math.round(area[year].total / area[year].count);
        }
      });
      return result;
    });
  })();

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

  // Setup print functionality
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Performance_Report_${learnerDetails?.first_name}_${learnerDetails?.last_name}_${selectedYear}_${selectedTerm}`,
  });

  const handleDownloadReportCard = () => {
    if (filteredPerformance.length === 0) {
      toast({
        title: "No Data",
        description: "No performance records available to generate report",
        variant: "destructive",
      });
      return;
    }
    
    handlePrint();
  };

  return (
    <div className="w-full min-h-screen px-3 md:px-6 pt-2 pb-4 md:pb-6 space-y-3">
      {/* Welcome Message */}
      <div className="mb-2">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
          Welcome back, {learnerDetails?.first_name}!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Here's your academic overview</p>
      </div>

      {/* Profile Header */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg border-2 border-primary/20">
              <AvatarImage src={learnerDetails?.photo_url} alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} className="object-cover" />
              <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold rounded-lg">
                {learnerDetails?.first_name?.[0]}{learnerDetails?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3 text-left">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {learnerDetails?.first_name} {learnerDetails?.last_name}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Admission No: <span className="font-semibold text-primary">{learnerDetails?.admission_number}</span></p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {learnerDetails?.current_grade?.name} {learnerDetails?.current_stream?.name}
                </Badge>
                <Badge className="text-xs px-2 py-0.5 bg-success text-success-foreground">Active</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="truncate">Born: {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"} ({learnerDetails?.date_of_birth ? calculateAge(learnerDetails.date_of_birth) : 0} yrs)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="capitalize">{learnerDetails?.gender}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="truncate">Enrolled: {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance Section */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="w-full sm:w-auto">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Academic Performance
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {showComparison 
                  ? "Year-over-Year Comparison"
                  : selectedYear && selectedTerm 
                    ? `${selectedYear} - ${selectedTerm.replace("term_", "Term ")}`
                    : "Filter to view performance"}
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs">{showComparison ? "Single View" : "Compare"}</span>
              </Button>
              {!showComparison && (
                <>
                  <Button onClick={handleDownloadReportCard} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none hover:bg-muted/50 transition-colors">
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                  <Button onClick={handleDownloadReportCard} variant="default" size="sm" className="gap-2 flex-1 sm:flex-none">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {/* Filters - Only show in single view mode */}
          {!showComparison && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
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
            </div>
          )}

          {/* Hidden printable report */}
          <div style={{ display: 'none' }}>
            <div ref={reportRef}>
              <PrintablePerformanceReport
                learner={learnerDetails}
                performance={filteredPerformance}
                academicYear={selectedYear}
                term={selectedTerm}
                examType={selectedExamType !== "all" ? selectedExamType : undefined}
              />
            </div>
          </div>

          {!showComparison && filteredPerformance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No performance records for selected filters</p>
          ) : showComparison && performance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No performance records available</p>
          ) : (
            <>
              {/* Performance Overview & Table - Flex Layout on Large Screens */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Performance Overview Graph */}
                <div className="flex-1 rounded-lg border border-border/50 overflow-hidden bg-card">
                  <div className="p-3 border-b bg-muted/30">
                    <h3 className="text-base font-semibold">
                      {showComparison ? "Year-over-Year Progress" : "Performance Overview"}
                    </h3>
                  </div>
                  <div className="p-3">
                    <div className="w-full overflow-x-auto">
                      <div style={{ minWidth: `${Math.max(400, (showComparison ? comparisonChartData : chartData).length * 60)}px` }}>
                        <ResponsiveContainer width="100%" height={250}>
                          {showComparison ? (
                            <LineChart data={comparisonChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                              <XAxis 
                                dataKey="area" 
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 9 }}
                                stroke="hsl(var(--muted-foreground))"
                                interval={0}
                              />
                              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={30} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }} />
                              {uniqueYears.sort().map((year, idx) => (
                                <Line 
                                  key={year}
                                  type="linear" 
                                  dataKey={year} 
                                  stroke={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
                                  strokeWidth={2}
                                  name={year}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                              ))}
                            </LineChart>
                          ) : (
                            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <defs>
                                <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                              <XAxis 
                                dataKey="area" 
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 9 }}
                                stroke="hsl(var(--muted-foreground))"
                                interval={0}
                              />
                              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={30} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }} />
                              <Line 
                                type="linear" 
                                dataKey="marks" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                fill="url(#colorMarks)"
                                name="Average Marks"
                                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Table - Only show in single view mode */}
                {!showComparison && (
                  <div className="flex-1 overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 h-8">
                      <TableHead className="font-semibold whitespace-nowrap min-w-[100px] py-1 text-xs">Learning Area</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap w-14 py-1 text-xs">Opener</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap w-14 py-1 text-xs">Mid-Term</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap w-14 py-1 text-xs">Final</TableHead>
                      <TableHead className="text-center font-semibold whitespace-nowrap w-16 py-1 text-xs">Average</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap w-24 py-1 text-xs">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {groupedPerformance.map((area, index) => (
                      <TableRow key={index} className="hover:bg-muted/30 transition-colors h-7">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">{area.area}</TableCell>
                        <TableCell className="text-center py-1">
                          {area.opener !== null ? (
                            <div className="space-y-0.5">
                              <Badge className={`${getGradeColor(area.opener)} text-xs px-1 py-0`}>
                                {area.opener}
                              </Badge>
                              {area.grades.opener && (
                                <div className="text-[10px] text-muted-foreground">{area.grades.opener}</div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center py-1">
                          {area.midterm !== null ? (
                            <div className="space-y-0.5">
                              <Badge className={`${getGradeColor(area.midterm)} text-xs px-1 py-0`}>
                                {area.midterm}
                              </Badge>
                              {area.grades.midterm && (
                                <div className="text-[10px] text-muted-foreground">{area.grades.midterm}</div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center py-1">
                          {area.final !== null ? (
                            <div className="space-y-0.5">
                              <Badge className={`${getGradeColor(area.final)} text-xs px-1 py-0`}>
                                {area.final}
                              </Badge>
                              {area.grades.final && (
                                <div className="text-[10px] text-muted-foreground">{area.grades.final}</div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center py-1">
                          {area.average !== null ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="inline-block px-2 py-0.5 rounded-md font-bold text-primary text-xs bg-primary/10">
                                {area.average}
                              </span>
                              {area.deviation !== null && (
                                <div className="flex items-center">
                                  {area.deviation > 0 ? (
                                    <ArrowUp className="h-3 w-3 text-green-600" />
                                  ) : area.deviation < 0 ? (
                                    <ArrowDown className="h-3 w-3 text-red-600" />
                                  ) : null}
                                </div>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="py-1">
                          <div className="space-y-0.5 text-[10px] text-muted-foreground">
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
              )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-500/10 to-primary/10">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-3">
            <div className="text-2xl font-bold text-foreground">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.totalSubjects} subjects
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-500/10 to-accent/10">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fees Accumulated</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="pt-3">
            <div className="text-2xl font-bold text-foreground">{formatCurrency(feeInfo.totalAccumulatedFees)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total fees</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-500/10 to-success/10">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="pt-3">
            <div className="text-2xl font-bold text-success">{formatCurrency(feeInfo.totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">{transactions.length} payments</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-orange-500/10 to-destructive/10">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fee Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="pt-3">
            <div className="text-2xl font-bold text-destructive">{formatCurrency(feeInfo.totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full sm:w-auto h-10 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all">Profile</TabsTrigger>
          <TabsTrigger value="fees" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all">Fees</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-3">
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b p-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
        <TabsContent value="fees" className="space-y-3">
          {/* Fee Summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
            <CardHeader className="pb-3 border-b p-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-5 w-5 text-primary" />
                Fee Summary
              </CardTitle>
              <CardDescription className="text-xs">Your complete fee information</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-card border border-border/50">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-2">Total Fees</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(feeInfo.totalAccumulatedFees)}</p>
                  <p className="text-xs text-muted-foreground mt-2">From {invoices.length} invoices</p>
                </div>
                <div className="p-6 rounded-lg bg-card border border-border/50 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-2">Amount Paid</p>
                  <p className="text-3xl font-bold text-success">{formatCurrency(feeInfo.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{transactions.length} payments</p>
                </div>
                <div className="p-6 rounded-lg bg-card border border-border/50 shadow-sm">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-2">Balance Due</p>
                  <p className={`text-3xl font-bold ${feeInfo.totalBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(feeInfo.totalBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Term Fees */}
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b p-4">
              <CardTitle className="text-base font-semibold">Current Term Fees</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Term Fees</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(feeInfo.currentTermFees)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Paid</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(feeInfo.currentTermPaid)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Balance</p>
                  <p className={`text-2xl font-bold ${feeInfo.currentTermBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(feeInfo.currentTermBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b p-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-4">
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No invoices found</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border/50 rounded-lg gap-2 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <p className="font-semibold text-base text-primary">{invoice.invoice_number}</p>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{invoice.academic_year}</span>
                          <span> • {invoice.term.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <p className="font-bold text-lg">{formatCurrency(invoice.balance_due)}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'partial' ? 'secondary' :
                          invoice.status === 'overdue' ? 'destructive' : 'outline'
                        } className="text-xs shadow-sm">
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
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b p-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No payments recorded</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border/50 rounded-lg gap-2 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <p className="font-semibold text-base text-foreground">{transaction.transaction_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.payment_date).toLocaleDateString()} • <span className="font-medium">{transaction.payment_method}</span>
                        </p>
                      </div>
                      <div className="w-full sm:w-auto text-left sm:text-right">
                        <p className="font-bold text-success text-lg">{formatCurrency(transaction.amount_paid)}</p>
                        {transaction.reference_number && (
                          <p className="text-xs text-muted-foreground mt-1">Ref: {transaction.reference_number}</p>
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
