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
import { User, TrendingUp, Calendar, Download, Printer, BarChart3, ArrowUp, ArrowDown, BookOpen, Lightbulb, Target, Award, Users, Minus, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";

// Helper function to group performance by learning area with deviation calculation
const groupPerformanceByArea = (records: any[], allRecords: any[], currentYear: string, currentTerm: string) => {
  const grouped = records.reduce((acc: any, record) => {
    const areaName = record.learning_area?.name || "Unknown";
    const areaCode = record.learning_area?.code || "N/A";
    if (!acc[areaName]) {
      acc[areaName] = {
        area: areaName,
        code: areaCode,
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
  });
  const [performance, setPerformance] = useState<any[]>([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [showComparison, setShowComparison] = useState(false);
  
  // AI Recommendations
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [classAverages, setClassAverages] = useState<any[]>([]);

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
        learning_area:learning_areas(name, code),
        academic_period:academic_periods(academic_year, term)
      `)
      .eq("learner_id", learner.id)
      .order("created_at", { ascending: false });

    setPerformance(performanceData || []);

    // Get current academic period for class comparison
    const { data: currentAcademicPeriod } = await supabase
      .from("academic_periods")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();

    // Fetch class averages for peer comparison
    if (learner.current_grade_id && learner.current_stream_id && currentAcademicPeriod) {
      const { data: classPerformance } = await supabase
        .from("performance_records")
        .select(`
          learning_area_id,
          marks,
          learning_area:learning_areas(name, code)
        `)
        .eq("grade_id", learner.current_grade_id)
        .eq("stream_id", learner.current_stream_id)
        .eq("academic_year", currentAcademicPeriod.academic_year)
        .eq("term", currentAcademicPeriod.term);

      if (classPerformance) {
        const averagesByArea = classPerformance.reduce((acc: any, record: any) => {
          if (!acc[record.learning_area_id]) {
            acc[record.learning_area_id] = {
              learning_area: record.learning_area,
              total: 0,
              count: 0
            };
          }
          acc[record.learning_area_id].total += Number(record.marks);
          acc[record.learning_area_id].count += 1;
          return acc;
        }, {});

        const classAvgs = Object.values(averagesByArea).map((area: any) => ({
          learning_area: area.learning_area,
          classAverage: area.total / area.count
        }));
        
        setClassAverages(classAvgs);
      }
    }

    // Calculate stats
    const avgScore = performanceData?.length
      ? performanceData.reduce((sum, p) => sum + Number(p.marks), 0) / performanceData.length
      : 0;

    // Count unique learning areas
    const subjectCount = performanceData 
      ? new Set(performanceData.map(p => p.learning_area_id)).size 
      : 0;

    setStats({
      totalSubjects: subjectCount,
      averageScore: Math.round(avgScore),
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
    code: area.code,
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

  // Fetch AI recommendations
  const fetchAIRecommendations = async (strengths: any[], weaknesses: any[]) => {
    if (strengths.length === 0 && weaknesses.length === 0) return;
    
    try {
      setLoadingRecommendations(true);
      const { data, error } = await supabase.functions.invoke('study-recommendations', {
        body: {
          strengths,
          weaknesses,
          learnerName: `${learnerDetails?.first_name} ${learnerDetails?.last_name}`
        }
      });

      if (error) throw error;
      
      if (data?.recommendation) {
        setAiRecommendation(data.recommendation);
      }
    } catch (error: any) {
      console.error("Error fetching AI recommendations:", error);
      if (error.message?.includes("429")) {
        toast({
          title: "Rate Limit",
          description: "Too many requests. Please try again later.",
          variant: "destructive",
        });
      } else if (error.message?.includes("402")) {
        toast({
          title: "Credits Required",
          description: "AI credits depleted. Please contact support.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingRecommendations(false);
    }
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
                                dataKey="code" 
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 9 }}
                                stroke="hsl(var(--muted-foreground))"
                                interval={0}
                              />
                              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={30} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                                labelFormatter={(value, payload) => {
                                  if (payload && payload.length > 0) {
                                    return payload[0].payload.area;
                                  }
                                  return value;
                                }}
                              />
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

      {/* Performance Trends Section */}
      {performance.length > 0 && (() => {
        // Calculate term averages for all terms
        const termAverages: { year: string; term: string; average: number; subjectCount: number }[] = [];
        const termGroups: Record<string, { total: number; count: number }> = {};
        
        performance.forEach(record => {
          const key = `${record.academic_year}-${record.term}`;
          if (!termGroups[key]) {
            termGroups[key] = { total: 0, count: 0 };
          }
          termGroups[key].total += Number(record.marks);
          termGroups[key].count += 1;
        });
        
        Object.entries(termGroups).forEach(([key, data]) => {
          const [year, term] = key.split('-');
          termAverages.push({
            year,
            term,
            average: Math.round(data.total / data.count),
            subjectCount: data.count
          });
        });
        
        // Sort by year and term
        termAverages.sort((a, b) => {
          if (a.year !== b.year) return a.year.localeCompare(b.year);
          return a.term.localeCompare(b.term);
        });
        
        // Calculate trends
        const trendsData = termAverages.map((current, index) => {
          if (index === 0) return { ...current, change: null, percentChange: null };
          const previous = termAverages[index - 1];
          const change = current.average - previous.average;
          const percentChange = previous.average > 0 
            ? Math.round((change / previous.average) * 100) 
            : 0;
          return { ...current, change, percentChange };
        });
        
        return trendsData.length > 1 ? (
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Term-over-term progress analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {trendsData.map((trend, index) => (
                  <Card key={index} className="border-border/50 bg-gradient-to-br from-card to-muted/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            {trend.year}
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {trend.term.replace('term_', 'Term ')}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {trend.subjectCount} subjects
                        </Badge>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-foreground">{trend.average}%</p>
                          <p className="text-xs text-muted-foreground">Average</p>
                        </div>
                        
                        {trend.change !== null && (
                          <div className="flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                              trend.change > 0 
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                                : trend.change < 0 
                                  ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                                  : 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
                            }`}>
                              {trend.change > 0 ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : trend.change < 0 ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : null}
                              <span className="text-sm font-bold">
                                {trend.change > 0 ? '+' : ''}{trend.change}%
                              </span>
                            </div>
                            {trend.percentChange !== null && trend.percentChange !== 0 && (
                              <p className="text-xs text-muted-foreground">
                                {trend.percentChange > 0 ? '+' : ''}{trend.percentChange}% change
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {index === trendsData.length - 1 && trend.change !== null && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            {trend.change > 0 
                              ? '🎉 Great improvement! Keep up the good work.'
                              : trend.change < 0
                                ? '📚 Focus on improving your performance next term.'
                                : '➡️ Maintain consistent performance.'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {trendsData.length > 0 && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground mb-1">Overall Trend Analysis</p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const firstTerm = trendsData[0];
                          const lastTerm = trendsData[trendsData.length - 1];
                          const overallChange = lastTerm.average - firstTerm.average;
                          const overallPercent = firstTerm.average > 0 
                            ? Math.round((overallChange / firstTerm.average) * 100)
                            : 0;
                          
                          return (
                            <>
                              From {firstTerm.year} {firstTerm.term.replace('term_', 'Term ')} ({firstTerm.average}%) to {' '}
                              {lastTerm.year} {lastTerm.term.replace('term_', 'Term ')} ({lastTerm.average}%): {' '}
                              <span className={`font-bold ${
                                overallChange > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : overallChange < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-foreground'
                              }`}>
                                {overallChange > 0 ? '+' : ''}{overallChange}% ({overallPercent > 0 ? '+' : ''}{overallPercent}% change)
                              </span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Strengths & Weaknesses Analysis */}
      {performance.length > 0 && (() => {
        // Calculate average per learning area across all records
        const areaAverages: Record<string, { total: number; count: number; area: string; code: string }> = {};
        
        performance.forEach(record => {
          const areaName = record.learning_area?.name || "Unknown";
          const areaCode = record.learning_area?.code || "N/A";
          if (!areaAverages[areaName]) {
            areaAverages[areaName] = { total: 0, count: 0, area: areaName, code: areaCode };
          }
          areaAverages[areaName].total += Number(record.marks);
          areaAverages[areaName].count += 1;
        });
        
        const averages = Object.values(areaAverages).map(item => ({
          area: item.area,
          code: item.code,
          average: Math.round(item.total / item.count),
          count: item.count
        })).sort((a, b) => b.average - a.average);
        
        if (averages.length === 0) return null;
        
        // Get top 3 strengths and bottom 3 weaknesses
        const strengths = averages.slice(0, Math.min(3, averages.length));
        const weaknesses = averages.slice(-Math.min(3, averages.length)).reverse();
        
        // Calculate trend for each subject (last 3 records)
        const getTrend = (areaName: string) => {
          const areaRecords = performance
            .filter(r => r.learning_area?.name === areaName)
            .slice(0, 3)
            .map(r => Number(r.marks));
          
          if (areaRecords.length < 2) return "stable";
          
          const recent = areaRecords[0];
          const previous = areaRecords[areaRecords.length - 1];
          const diff = recent - previous;
          
          if (diff > 5) return "improving";
          if (diff < -5) return "declining";
          return "stable";
        };
        
        const strengthsWithTrend = strengths.map(s => ({ ...s, trend: getTrend(s.area) }));
        const weaknessesWithTrend = weaknesses.map(w => ({ ...w, trend: getTrend(w.area) }));
        
        return (
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Strengths & Weaknesses Analysis
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Performance insights with personalized study recommendations
                  </CardDescription>
                </div>
                <Button
                  onClick={() => fetchAIRecommendations(strengthsWithTrend, weaknessesWithTrend)}
                  disabled={loadingRecommendations}
                  size="sm"
                  className="gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  {loadingRecommendations ? "Generating..." : "Get AI Tips"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Strengths */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-foreground">Your Strengths</h3>
                  </div>
                  <div className="space-y-2">
                    {strengthsWithTrend.map((strength, index) => (
                      <Card key={index} className="border-green-200 dark:border-green-900 bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-600 text-white border-0 text-xs">
                                  #{index + 1}
                                </Badge>
                                <span className="font-semibold text-sm text-foreground">
                                  {strength.area}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {strength.count} assessment{strength.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                  {strength.average}%
                                </div>
                              </div>
                              {strength.trend === "improving" && (
                                <ArrowUp className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-foreground">Areas for Growth</h3>
                  </div>
                  <div className="space-y-2">
                    {weaknessesWithTrend.map((weakness, index) => (
                      <Card key={index} className="border-orange-200 dark:border-orange-900 bg-gradient-to-r from-orange-50 to-orange-50/50 dark:from-orange-950/20 dark:to-orange-950/10">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-orange-600 text-white border-0 text-xs">
                                  Focus
                                </Badge>
                                <span className="font-semibold text-sm text-foreground">
                                  {weakness.area}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {weakness.count} assessment{weakness.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                                  {weakness.average}%
                                </div>
                              </div>
                              {weakness.trend === "declining" && (
                                <ArrowDown className="h-4 w-4 text-red-600" />
                              )}
                              {weakness.trend === "improving" && (
                                <ArrowUp className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              {aiRecommendation && (
                <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2">Personalized Study Recommendations</h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                        {aiRecommendation}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loadingRecommendations && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-muted-foreground">Generating personalized recommendations...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Peer Comparison */}
      {classAverages.length > 0 && performance.length > 0 && currentPeriod && (() => {
        const currentTermPerformance = performance.filter(
          r => r.academic_year === currentPeriod.academic_year && r.term === currentPeriod.term
        );
        
        if (currentTermPerformance.length === 0) return null;
        
        const myAveragesByArea = currentTermPerformance.reduce((acc: any, record: any) => {
          const areaName = record.learning_area?.name || "Unknown";
          const areaCode = record.learning_area?.code || "N/A";
          if (!acc[areaName]) {
            acc[areaName] = { total: 0, count: 0, code: areaCode };
          }
          acc[areaName].total += Number(record.marks);
          acc[areaName].count += 1;
          return acc;
        }, {});
        
        const myAverages = Object.entries(myAveragesByArea).map(([area, data]: [string, any]) => ({
          area,
          code: data.code,
          average: data.total / data.count
        }));
        
        return (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Class Comparison</CardTitle>
              </div>
              <CardDescription className="text-xs">
                See how you perform relative to your classmates (anonymized data)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {classAverages.map((classData) => {
                const myPerformance = myAverages.find(
                  p => p.area === classData.learning_area.name
                );
                
                if (!myPerformance) return null;
                
                const myAvg = myPerformance.average;
                const classAvg = classData.classAverage;
                const difference = myAvg - classAvg;
                const percentDiff = ((difference / classAvg) * 100).toFixed(1);
                
                let status: "above" | "below" | "average" = "average";
                let icon = <Minus className="h-4 w-4" />;
                let color = "text-muted-foreground";
                
                if (Math.abs(difference) > 2) {
                  if (difference > 0) {
                    status = "above";
                    icon = <TrendingUp className="h-4 w-4" />;
                    color = "text-green-600";
                  } else {
                    status = "below";
                    icon = <TrendingDown className="h-4 w-4" />;
                    color = "text-orange-600";
                  }
                }
                
                return (
                  <div key={classData.learning_area.code} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{classData.learning_area.name}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Your Score: <span className="font-semibold text-foreground">{myAvg.toFixed(1)}</span></span>
                        <span>Class Avg: <span className="font-semibold">{classAvg.toFixed(1)}</span></span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${color}`}>
                      {icon}
                      <span className="text-sm font-semibold">
                        {status === "above" ? "+" : status === "below" ? "" : "±"}{Math.abs(Number(percentDiff))}%
                      </span>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
              
              {myAverages.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No class comparison data available yet
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Stats Overview */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-500/10 to-primary/10">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-3">
            <div className="text-xl font-bold text-foreground">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.totalSubjects} subjects
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden bg-gradient-to-br from-card to-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-500/10 to-accent/10">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="pt-3">
            <div className="text-xl font-bold text-foreground">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Learning areas</p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
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
    </div>
  );
}
