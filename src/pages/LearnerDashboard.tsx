import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Award, AlertCircle, Target, DollarSign, Users, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";


const getGradeCategory = (marks: number) => {
  if (marks >= 80) return { label: "E.E", description: "Exceeding Expectation", color: "text-green-600" };
  if (marks >= 50) return { label: "M.E", description: "Meeting Expectation", color: "text-blue-600" };
  if (marks >= 30) return { label: "A.E", description: "Approaching Expectation", color: "text-yellow-600" };
  return { label: "B.E", description: "Below Expectation", color: "text-red-600" };
};

export default function LearnerDashboard() {
  const { learnerDetails } = useOutletContext<any>();
  const { user } = useAuth();
  const learner = user?.data;
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalSubjects: 0,
    averageScore: 0,
  });
  const [performance, setPerformance] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [feeBalance, setFeeBalance] = useState(0);
  const [position, setPosition] = useState<{ grade: number; stream: number; gradeTotal: number; streamTotal: number } | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<{ year: string; term: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradeName, setGradeName] = useState("");
  const [performanceReleases, setPerformanceReleases] = useState<any[]>([]);

  useEffect(() => {
    if (learner) {
      fetchAllData();
    }
  }, [learner]);

  const fetchAllData = async () => {
    if (!learner) return;

    try {
      setLoading(true);
      
      // Fetch current academic period
      const { data: currentAcademicPeriod } = await supabase
        .from("academic_periods")
        .select("academic_year, term")
        .eq("is_current", true)
        .maybeSingle();

      if (currentAcademicPeriod) {
        setCurrentPeriod({
          year: currentAcademicPeriod.academic_year,
          term: currentAcademicPeriod.term
        });
      }
      
      // Fetch performance releases
      const { data: releasesData } = await supabase
        .from("performance_releases")
        .select("*");
      
      setPerformanceReleases(releasesData || []);

      // Fetch performance data
      const { data: performanceData } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          academic_period:academic_periods(academic_year, term),
          grade:grades(id, name)
        `)
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false });

      setPerformance(performanceData || []);

      // Set default filters to learner's current grade and current academic period
      if (!selectedGrade && learner.current_grade_id) {
        setSelectedGrade(learner.current_grade_id);
      }
      if (!selectedTerm && currentAcademicPeriod?.term) {
        setSelectedTerm(currentAcademicPeriod.term);
      }

      // Fetch fee balance
      const { data: invoices } = await supabase
        .from("student_invoices")
        .select("*")
        .eq("learner_id", learner.id)
        .neq("status", "cancelled");

      const { data: transactions } = await supabase
        .from("fee_transactions")
        .select("amount_paid")
        .eq("learner_id", learner.id);

      const { data: feePayments } = await supabase
        .from("fee_payments")
        .select("amount_paid")
        .eq("learner_id", learner.id);

      const totalFees = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      const totalPaid = 
        (transactions?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0) +
        (feePayments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0);

      setFeeBalance(totalFees - totalPaid);

      // Fetch grade name
      if (learner.current_grade_id) {
        const { data: gradeData } = await supabase
          .from("grades")
          .select("name")
          .eq("id", learner.current_grade_id)
          .single();
        
        if (gradeData) {
          setGradeName(gradeData.name);
        }
      }

      // Calculate position will be done when filters are applied
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate position based on current filters
  useEffect(() => {
    const calculatePosition = async () => {
      if (!learner?.current_grade_id || !learner?.current_stream_id || !selectedGrade || !selectedTerm) {
        setPosition(null);
        return;
      }

      try {
        // Build query with filters
        let gradeQuery = supabase
          .from("performance_records")
          .select("learner_id, marks")
          .eq("grade_id", selectedGrade)
          .eq("term", selectedTerm as any);

        let streamQuery = supabase
          .from("performance_records")
          .select("learner_id, marks")
          .eq("stream_id", learner.current_stream_id)
          .eq("term", selectedTerm as any);

        if (selectedExamType !== "all") {
          gradeQuery = gradeQuery.eq("exam_type", selectedExamType);
          streamQuery = streamQuery.eq("exam_type", selectedExamType);
        }

        const { data: gradePerformance } = await gradeQuery;
        const { data: streamPerformance } = await streamQuery;

        // Calculate averages per learner
        const calculatePosition = (data: any[]) => {
          const learnerAverages = data.reduce((acc: any, record: any) => {
            if (!acc[record.learner_id]) {
              acc[record.learner_id] = { total: 0, count: 0 };
            }
            acc[record.learner_id].total += Number(record.marks);
            acc[record.learner_id].count += 1;
            return acc;
          }, {});

          const averages = Object.entries(learnerAverages).map(([id, data]: [string, any]) => ({
            learner_id: id,
            average: data.total / data.count
          })).sort((a, b) => b.average - a.average);

          return { 
            position: averages.findIndex(l => l.learner_id === learner.id) + 1,
            total: averages.length
          };
        };

        const calculatePositionFromData = (data: any[]) => {
          const learnerAverages = data.reduce((acc: any, record: any) => {
            if (!acc[record.learner_id]) {
              acc[record.learner_id] = { total: 0, count: 0 };
            }
            acc[record.learner_id].total += Number(record.marks);
            acc[record.learner_id].count += 1;
            return acc;
          }, {});

          const averages = Object.entries(learnerAverages).map(([id, data]: [string, any]) => ({
            learner_id: id,
            average: data.total / data.count
          })).sort((a, b) => b.average - a.average);

          return { 
            position: averages.findIndex(l => l.learner_id === learner.id) + 1,
            total: averages.length
          };
        };

        const gradePos = gradePerformance ? calculatePositionFromData(gradePerformance) : { position: 0, total: 0 };
        const streamPos = streamPerformance ? calculatePositionFromData(streamPerformance) : { position: 0, total: 0 };

        setPosition({
          grade: gradePos.position,
          stream: streamPos.position,
          gradeTotal: gradePos.total,
          streamTotal: streamPos.total,
        });
      } catch (error) {
        console.error("Error calculating position:", error);
      }
    };

    calculatePosition();
  }, [learner, selectedGrade, selectedTerm, selectedExamType]);

  // Helper function to check if marks are released
  const isMarksReleased = (record: any) => {
    return performanceReleases.some(release => {
      const matchesYear = release.academic_year === record.academic_year;
      const matchesTerm = release.term === record.term;
      const matchesExamType = release.exam_type === record.exam_type;
      const matchesGrade = !release.grade_id || release.grade_id === record.grade_id;
      const matchesStream = !release.stream_id || release.stream_id === record.stream_id;
      
      return matchesYear && matchesTerm && matchesExamType && matchesGrade && matchesStream;
    });
  };

  // Only show released performance records
  const releasedPerformance = performance.filter(record => isMarksReleased(record));

  const filteredPerformance = releasedPerformance.filter(record => {
    if (selectedGrade && record.grade_id !== selectedGrade) return false;
    if (selectedTerm && record.term !== selectedTerm) return false;
    if (selectedExamType !== "all" && record.exam_type !== selectedExamType) return false;
    return true;
  });

  // Get unique grades from released performance records - properly deduplicated
  const uniqueGrades = Array.from(
    new Map(
      releasedPerformance
        .filter(p => p.grade_id && p.grade?.name)
        .map(p => [p.grade_id, { id: p.grade_id, name: p.grade.name }])
    ).values()
  );
  
  const uniqueTerms = ["term_1", "term_2", "term_3"];
  const examTypes = [
    { value: "all", label: "All Exams" },
    { value: "opener", label: "Opener" },
    { value: "mid-term", label: "Mid-Term" },
    { value: "final", label: "Final" }
  ];

  // Calculate filtered stats based on selected filters
  const filteredStats = {
    totalSubjects: filteredPerformance.length 
      ? new Set(filteredPerformance.map(p => p.learning_area_id)).size 
      : 0,
    averageScore: filteredPerformance.length
      ? Math.round(filteredPerformance.reduce((sum, p) => sum + Number(p.marks), 0) / filteredPerformance.length)
      : 0
  };

  const averageGrade = filteredStats.averageScore > 0 ? getGradeCategory(filteredStats.averageScore) : null;

  // Group by learning area
  const groupedPerformance = filteredPerformance.reduce((acc: any, record) => {
    const areaName = record.learning_area?.name || "Unknown";
    const areaCode = record.learning_area?.code || "N/A";
    if (!acc[areaName]) {
      acc[areaName] = {
        area: areaName,
        code: areaCode,
        opener: null,
        midterm: null,
        final: null,
      };
    }
    
    const examType = record.exam_type?.toLowerCase();
    if (examType === "opener") {
      acc[areaName].opener = record.marks;
    } else if (examType === "mid-term" || examType === "midterm") {
      acc[areaName].midterm = record.marks;
    } else if (examType === "final") {
      acc[areaName].final = record.marks;
    }
    
    return acc;
  }, {});

  const tableData = Object.values(groupedPerformance).map((area: any) => {
    const scores = [area.opener, area.midterm, area.final].filter(s => s !== null);
    const average = scores.length > 0 
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length 
      : null;
    
    const avgRounded = average !== null ? Math.round(average * 10) / 10 : null;
    const grade = avgRounded !== null ? getGradeCategory(avgRounded) : null;
    
    return {
      ...area,
      average: avgRounded,
      grade: grade,
    };
  });

  // Fetch class averages for comparison
  const [classAverages, setClassAverages] = useState<any[]>([]);

  useEffect(() => {
    const fetchClassAverages = async () => {
      if (!learner?.current_stream_id || !selectedGrade || !selectedTerm) return;

      let query = supabase
        .from("performance_records")
        .select(`
          learning_area_id,
          marks,
          learning_areas (code)
        `)
        .eq("grade_id", selectedGrade)
        .eq("stream_id", learner.current_stream_id)
        .eq("term", selectedTerm as any);

      if (selectedExamType !== "all") {
        query = query.eq("exam_type", selectedExamType);
      }

      const { data } = await query;

      if (!data) return;

      // Calculate mean for each learning area
      const areaStats: Record<string, { total: number; count: number; code: string }> = {};
      
      data.forEach((record: any) => {
        const areaId = record.learning_area_id;
        const code = record.learning_areas?.code || "";
        
        if (!areaStats[areaId]) {
          areaStats[areaId] = { total: 0, count: 0, code };
        }
        
        areaStats[areaId].total += Number(record.marks);
        areaStats[areaId].count += 1;
      });

      const averages = Object.values(areaStats).map(stats => ({
        code: stats.code,
        mean: stats.total / stats.count
      }));

      setClassAverages(averages);
    };

    fetchClassAverages();
  }, [learner, selectedGrade, selectedTerm, selectedExamType]);

  // Performance over time data - group by grade, academic year, term, exam type (only released)
  const performanceOverTime = releasedPerformance.reduce((acc: any[], record) => {
    const recordGradeName = record.grade?.name || 'N/A';
    const key = `${recordGradeName}-${record.academic_year}-${record.term}-${record.exam_type || 'unknown'}`;
    const existing = acc.find(item => item.key === key);
    
    if (existing) {
      existing.total += Number(record.marks);
      existing.count += 1;
    } else {
      acc.push({
        key,
        academic_year: record.academic_year,
        term: record.term,
        exam_type: record.exam_type || 'unknown',
        grade: recordGradeName,
        total: Number(record.marks),
        count: 1
      });
    }
    
    return acc;
  }, []).map(item => ({
    ...item,
    average: Math.round((item.total / item.count) * 10) / 10,
    label: `${item.grade} ${item.term.replace('term_', 'T')} ${item.exam_type}`
  })).sort((a, b) => {
    if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
    if (a.academic_year !== b.academic_year) return a.academic_year.localeCompare(b.academic_year);
    if (a.term !== b.term) return a.term.localeCompare(b.term);
    return a.exam_type.localeCompare(b.exam_type);
  });

  const chartData = tableData.map(area => {
    const classAvg = classAverages.find(ca => ca.code === area.code);
    return {
      code: area.code,
      area: area.area,
      average: area.average || 0,
      classAverage: classAvg ? Math.round(classAvg.mean * 10) / 10 : undefined
    };
  });

  // Best and weakest subjects
  const sortedByAverage = [...tableData].filter(a => a.average !== null).sort((a, b) => (b.average || 0) - (a.average || 0));
  const bestSubjects = sortedByAverage.slice(0, 3);
  const weakestSubjects = sortedByAverage.slice(-3).reverse();

  // Get selected grade name and academic year for display
  const selectedGradeName = uniqueGrades.find((g: any) => g.id === selectedGrade)?.name || gradeName || "";
  const selectedAcademicYear = filteredPerformance.length > 0 ? filteredPerformance[0].academic_year : currentPeriod?.year || "";
  const displayTerm = selectedTerm ? selectedTerm.replace("term_", "Term ") : "";
  const displayExamType = selectedExamType !== "all" ? selectedExamType : "";

  return (
    <div className="w-full min-h-screen px-3 md:px-6 pt-2 pb-4 md:pb-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {learnerDetails?.first_name}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {selectedGradeName && displayTerm && selectedAcademicYear
              ? `This is your ${selectedGradeName} ${displayTerm} ${selectedAcademicYear} overview`
              : currentPeriod && gradeName
              ? `This is your ${gradeName} ${currentPeriod.term.replace("term_", "Term ")} ${currentPeriod.year} overview`
              : "Here's your academic overview"}
          </p>
        </div>
        <Button 
          onClick={() => navigate("/learner-portal/ai-tutor")}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Tutor</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Filters</CardTitle>
          <CardDescription>Select grade, term, and exam type to view performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {uniqueGrades.map((grade: any) => (
                  grade.name && (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  )
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
                {examTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Card className="border-0 shadow-none bg-primary/5">
              <CardContent className="pt-6 pb-4">
                <p className="text-xs text-muted-foreground">Subjects</p>
                <p className="text-xl font-bold">{filteredStats.totalSubjects}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none bg-primary/5">
              <CardContent className="pt-6 pb-4">
                <p className="text-xs text-muted-foreground">Average</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{filteredStats.averageScore}%</p>
                  {averageGrade && (
                    <span className={`text-xs font-semibold ${averageGrade.color}`} title={averageGrade.description}>
                      {averageGrade.label}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="border-0 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fee Balance</p>
                <p className="text-sm font-bold text-destructive">KES {feeBalance.toLocaleString()}</p>
              </div>
              <DollarSign className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best & Weakest Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" />
              Top Performing Subjects
            </CardTitle>
            <CardDescription>
              {selectedGradeName && displayTerm && selectedAcademicYear
                ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}`
                : "Select filters to view top subjects"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bestSubjects.length > 0 ? bestSubjects.map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-primary/5 rounded">
                  <span className="text-sm font-medium">{subject.area}</span>
                  <Badge variant="default" className="text-xs">{subject.average}%</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No performance data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              {selectedGradeName && displayTerm && selectedAcademicYear
                ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}`
                : "Select filters to view areas for improvement"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weakestSubjects.length > 0 ? weakestSubjects.map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-destructive/5 rounded">
                  <span className="text-sm font-medium">{subject.area}</span>
                  <Badge variant="destructive" className="text-xs">{subject.average}%</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No performance data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table and Graphs - 3 column layout on large screens, stacked on small */}
      {tableData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Performance Table */}
          <Card>
            <CardHeader className="py-3 md:py-6">
              <CardTitle className="text-sm md:text-base">Detailed Performance</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {selectedGradeName && displayTerm && selectedAcademicYear
                  ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}${displayExamType ? ` - ${displayExamType}` : ""}`
                  : "Select filters to view performance"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="h-7 py-1 px-2 text-[10px] md:text-sm md:px-4 md:py-2 whitespace-nowrap">Subject</TableHead>
                      <TableHead className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap">Opener</TableHead>
                      <TableHead className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap">Mid</TableHead>
                      <TableHead className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap">Final</TableHead>
                      <TableHead className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap">Avg</TableHead>
                      <TableHead className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((area: any, idx: number) => (
                      <TableRow key={idx} className="border-b">
                        <TableCell className="h-7 py-1 px-2 text-[10px] md:text-sm md:px-4 md:py-2 font-medium whitespace-nowrap">{area.area}</TableCell>
                        <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center">{area.opener ?? "-"}</TableCell>
                        <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center">{area.midterm ?? "-"}</TableCell>
                        <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center">{area.final ?? "-"}</TableCell>
                        <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center font-semibold">
                          {area.average ? `${area.average}%` : "-"}
                        </TableCell>
                        <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center">
                          {area.grade ? (
                            <span className={`font-semibold ${area.grade.color}`} title={area.grade.description}>
                              {area.grade.label}
                            </span>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
        {/* Performance Overview Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Overview
            </CardTitle>
            <CardDescription>
              {selectedGradeName && displayTerm && selectedAcademicYear
                ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}${displayExamType ? ` - ${displayExamType}` : ""}`
                : "Filter to view performance"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {filteredPerformance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No performance records for selected filters</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="code" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const learnerScore = payload.find(p => p.dataKey === 'average');
                        const classAvg = payload.find(p => p.dataKey === 'classAverage');
                        const grade = learnerScore ? getGradeCategory(learnerScore.value as number) : null;
                        
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                            <p className="font-semibold text-sm">{payload[0].payload.area}</p>
                            {learnerScore && (
                              <>
                                <p className="text-xs">Your Score: {learnerScore.value}%</p>
                                {grade && (
                                  <p className="text-xs font-medium">
                                    <span className={grade.color}>{grade.label}</span> - {grade.description}
                                  </p>
                                )}
                              </>
                            )}
                            {classAvg && classAvg.value && (
                              <p className="text-xs text-green-600">Class Average: {classAvg.value}%</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: "10px" }}
                    iconType="line"
                    formatter={(value) => {
                      if (value === "average") return "Your Score";
                      if (value === "classAverage") return "Class Average";
                      return value;
                    }}
                  />
                  <Line type="linear" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2} name="Your Score" />
                  <Line type="linear" dataKey="classAverage" stroke="hsl(142 76% 36%)" strokeWidth={2} name="Class Average" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Performance Over Time Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Over Time
            </CardTitle>
            <CardDescription>Overall average across all periods and grades</CardDescription>
          </CardHeader>
          
          <CardContent>
            {performanceOverTime.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No performance data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="label" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 9 }}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const grade = getGradeCategory(data.average);
                        
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                            <p className="font-semibold text-sm">{data.academic_year}</p>
                            <p className="text-xs">{data.grade} - {data.term.replace('term_', 'Term ')}</p>
                            <p className="text-xs">{data.exam_type}</p>
                            <p className="text-xs font-semibold mt-1">Average: {data.average}%</p>
                            <p className="text-xs">
                              <span className={grade.color}>{grade.label}</span> - {grade.description}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="linear" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2} name="Overall Average" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* Download Report Button - Below Graphs */}
      {learner && filteredPerformance.length > 0 && (
        <div className="flex justify-center mt-6">
          <PrintablePerformanceReport
            learner={{
              ...learner,
              current_grade: { name: selectedGradeName },
              current_stream: learner.current_stream
            }}
            performance={filteredPerformance}
            academicYear={selectedAcademicYear}
            term={selectedTerm}
            examType={selectedExamType === "all" ? undefined : selectedExamType}
            gradePosition={position?.grade}
            totalInGrade={position?.gradeTotal}
            streamPosition={position?.stream}
            totalInStream={position?.streamTotal}
          />
        </div>
      )}
    </div>
  );
}
