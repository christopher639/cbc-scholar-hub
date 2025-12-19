import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Award, AlertCircle, Target, DollarSign, Users, Sparkles, Lock, BookOpen, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PrintablePerformanceReport } from "@/components/PrintablePerformanceReport";
import { useExamTypes } from "@/hooks/useExamTypes";
import { useGradingScales } from "@/hooks/useGradingScales";
import { usePerformanceFormulas } from "@/hooks/usePerformanceFormulas";

export default function LearnerDashboard() {
  const { learnerDetails } = useOutletContext<any>();
  const { user } = useAuth();
  const learner = user?.data;
  const navigate = useNavigate();
  
  // Hooks for grading and formulas
  const { examTypes: allExamTypes } = useExamTypes();
  const { gradingScales, getGrade } = useGradingScales();
  const { activeFormula, getFormulaWeights, calculateWeightedAverage } = usePerformanceFormulas();
  
  // Get active exam types only
  const activeExamTypes = allExamTypes.filter(et => et.is_active);
  
  // Helper function to get grade from grading scales
  const getGradeFromScale = (percentage: number) => {
    const scale = getGrade(percentage);
    if (scale) {
      return {
        label: scale.grade_name,
        description: scale.description || scale.grade_name,
        color: percentage >= 80 ? "text-green-600" : 
               percentage >= 50 ? "text-blue-600" : 
               percentage >= 30 ? "text-yellow-600" : "text-red-600",
        points: scale.points
      };
    }
    // Fallback if no grading scale matches
    if (percentage >= 80) return { label: "E.E", description: "Exceeding Expectation", color: "text-green-600", points: 4 };
    if (percentage >= 50) return { label: "M.E", description: "Meeting Expectation", color: "text-blue-600", points: 3 };
    if (percentage >= 30) return { label: "A.E", description: "Approaching Expectation", color: "text-yellow-600", points: 2 };
    return { label: "B.E", description: "Below Expectation", color: "text-red-600", points: 1 };
  };
  
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
  const [promotionHistory, setPromotionHistory] = useState<any[]>([]);
  const [allGrades, setAllGrades] = useState<{id: string; name: string; isCurrent: boolean}[]>([]);

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

      // Fetch grade name for current grade
      let currentGradeName = "";
      if (learner.current_grade_id) {
        const { data: gradeData } = await supabase
          .from("grades")
          .select("name")
          .eq("id", learner.current_grade_id)
          .single();
        
        if (gradeData) {
          currentGradeName = gradeData.name;
          setGradeName(gradeData.name);
        }
      }

      // Fetch promotion history to get all grades the learner has been through
      const { data: promotionData } = await supabase
        .from("promotion_history")
        .select(`
          *,
          from_grade:grades!promotion_history_from_grade_id_fkey(id, name),
          to_grade:grades!promotion_history_to_grade_id_fkey(id, name)
        `)
        .eq("learner_id", learner.id)
        .order("promotion_date", { ascending: true });

      setPromotionHistory(promotionData || []);

      // Build a list of all grades (current + historical from promotions)
      const gradesMap = new Map<string, {id: string; name: string; isCurrent: boolean}>();
      
      // Add current grade first
      if (learner.current_grade_id && currentGradeName) {
        gradesMap.set(learner.current_grade_id, {
          id: learner.current_grade_id,
          name: currentGradeName,
          isCurrent: true
        });
      }

      // Add grades from promotion history
      if (promotionData) {
        promotionData.forEach((promo: any) => {
          if (promo.from_grade?.id && promo.from_grade?.name && !gradesMap.has(promo.from_grade.id)) {
            gradesMap.set(promo.from_grade.id, {
              id: promo.from_grade.id,
              name: promo.from_grade.name,
              isCurrent: promo.from_grade.id === learner.current_grade_id
            });
          }
          if (promo.to_grade?.id && promo.to_grade?.name && !gradesMap.has(promo.to_grade.id)) {
            gradesMap.set(promo.to_grade.id, {
              id: promo.to_grade.id,
              name: promo.to_grade.name,
              isCurrent: promo.to_grade.id === learner.current_grade_id
            });
          }
        });
      }

      // Also add grades from performance records (in case promotion history is incomplete)
      if (performanceData) {
        performanceData.forEach((record: any) => {
          if (record.grade?.id && record.grade?.name && !gradesMap.has(record.grade.id)) {
            gradesMap.set(record.grade.id, {
              id: record.grade.id,
              name: record.grade.name,
              isCurrent: record.grade.id === learner.current_grade_id
            });
          }
        });
      }

      // Convert to array and sort (current grade first, then alphabetically)
      const gradesArray = Array.from(gradesMap.values()).sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        return a.name.localeCompare(b.name);
      });

      setAllGrades(gradesArray);

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
    const recordExam = String(record.exam_type || "").toLowerCase().trim();

    return performanceReleases.some((release) => {
      const releaseExam = String(release.exam_type || "").toLowerCase().trim();
      const matchesYear = release.academic_year === record.academic_year;
      const matchesTerm = release.term === record.term;
      const matchesExamType = releaseExam === recordExam;
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
  
  // Dynamic exam types from database
  const examTypeOptions = [
    { value: "all", label: "All Exams" },
    ...activeExamTypes.map(et => ({ value: et.name, label: et.name }))
  ];

  // Stats computed after tableData (needs grouped performance averages)

  // Group by learning area with dynamic exam types
  const groupedPerformance = filteredPerformance.reduce((acc: any, record) => {
    const areaName = record.learning_area?.name || "Unknown";
    const areaCode = record.learning_area?.code || "N/A";
    const learningAreaId = record.learning_area_id;
    
    if (!acc[areaName]) {
      acc[areaName] = {
        area: areaName,
        code: areaCode,
        learning_area_id: learningAreaId,
        examScores: {} as Record<string, number | null>,
      };
      // Initialize all exam types with null
      activeExamTypes.forEach(et => {
        acc[areaName].examScores[et.name] = null;
      });
    }
    
    // Match exam type by name (case-insensitive)
    const examTypeName = record.exam_type;
    const matchedExamType = activeExamTypes.find(
      et => et.name.toLowerCase() === examTypeName?.toLowerCase()
    );
    
    if (matchedExamType) {
      acc[areaName].examScores[matchedExamType.name] = Number(record.marks);
    }
    
    return acc;
  }, {});

  // Calculate averages using the formula system
  const tableData = Object.values(groupedPerformance).map((area: any) => {
    // Use weighted average from formula if available
    const weightedAvg = calculateWeightedAverage(
      area.examScores,
      activeExamTypes.map(et => ({ id: et.id, name: et.name, max_marks: et.max_marks }))
    );
    
    const avgRounded = weightedAvg !== null ? Math.round(weightedAvg * 10) / 10 : null;
    const grade = avgRounded !== null ? getGradeFromScale(avgRounded) : null;
    
    return {
      ...area,
      average: avgRounded,
      grade: grade,
    };
  });

  // Calculate filtered stats based on selected filters
  // Use per-subject weighted averages so we don't double-count multiple exams per subject.
  const subjectsWithAverage = tableData.filter((a: any) => a.average !== null);

  const filteredStats = {
    totalSubjects: tableData.length,
    averageScore: subjectsWithAverage.length
      ? Math.round(
          subjectsWithAverage.reduce((sum: number, a: any) => sum + Number(a.average), 0) /
            subjectsWithAverage.length
        )
      : 0,
  };

  const averageGrade = filteredStats.averageScore > 0 ? getGradeFromScale(filteredStats.averageScore) : null;

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
  const selectedGradeName = allGrades.find(g => g.id === selectedGrade)?.name || gradeName || "";
  const selectedAcademicYear = filteredPerformance.length > 0 ? filteredPerformance[0].academic_year : currentPeriod?.year || "";
  const displayTerm = selectedTerm ? selectedTerm.replace("term_", "Term ") : "";
  const displayExamType = selectedExamType !== "all" ? selectedExamType : "";

  return (
    <div className="w-full min-h-screen px-2 sm:px-3 md:px-6 pt-2 pb-4 md:pb-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
            Welcome back, {learnerDetails?.first_name}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {selectedGradeName && displayTerm && selectedAcademicYear
              ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}`
              : currentPeriod && gradeName
              ? `${gradeName} ${currentPeriod.term.replace("term_", "Term ")} ${currentPeriod.year}`
              : "Your academic overview"}
          </p>
        </div>
        <Button 
          onClick={() => navigate("/learner-portal/ai-tutor")}
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-8 sm:h-9"
        >
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">AI Tutor</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Performance Filters</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Select grade, term, and exam type</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {allGrades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id} className="text-xs sm:text-sm">
                    {grade.name}{grade.isCurrent ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {uniqueTerms.map((term) => (
                  <SelectItem key={term} value={term} className="text-xs sm:text-sm">
                    {term.replace("term_", "Term ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm col-span-2 sm:col-span-1">
                <SelectValue placeholder="Exam Type" />
              </SelectTrigger>
              <SelectContent>
                {examTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-xs sm:text-sm">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Card className="border-0 shadow-none bg-primary/5">
              <CardContent className="p-3 sm:pt-6 sm:pb-4">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Subjects</p>
                <p className="text-lg sm:text-xl font-bold">{filteredStats.totalSubjects}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none bg-primary/5">
              <CardContent className="p-3 sm:pt-6 sm:pb-4">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Average</p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <p className="text-lg sm:text-xl font-bold">{filteredStats.averageScore}%</p>
                  {averageGrade && (
                    <span className={`text-[10px] sm:text-xs font-semibold ${averageGrade.color}`} title={averageGrade.description}>
                      {averageGrade.label}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-primary/5 border-0">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Subjects</p>
                <p className="text-lg sm:text-xl font-bold">{filteredStats.totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-0">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Overall Average</p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <p className="text-lg sm:text-xl font-bold">{filteredStats.averageScore}%</p>
                  {averageGrade && (
                    <span className={`text-[10px] sm:text-xs font-semibold ${averageGrade.color}`}>
                      {averageGrade.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-0">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Best Subject</p>
                <p className="text-xs sm:text-sm font-bold truncate">
                  {bestSubjects[0]?.area || "N/A"}
                </p>
                {bestSubjects[0] && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{bestSubjects[0].average}%</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-0">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-destructive/10 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Fee Balance</p>
                <p className="text-xs sm:text-sm font-bold text-destructive">KES {feeBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best & Weakest Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              Top Performing
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {selectedGradeName && displayTerm && selectedAcademicYear
                ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}`
                : "Select filters to view"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              {bestSubjects.length > 0 ? bestSubjects.map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 bg-primary/5 rounded">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-primary bg-primary/10 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium truncate">{subject.area}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2">{subject.average}%</Badge>
                    {subject.grade && (
                      <span className={`text-[10px] sm:text-xs font-semibold ${subject.grade.color}`}>
                        {subject.grade.label}
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-xs sm:text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
              Needs Improvement
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {selectedGradeName && displayTerm && selectedAcademicYear
                ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}`
                : "Select filters to view"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              {weakestSubjects.length > 0 ? weakestSubjects.map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 bg-destructive/5 rounded">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-destructive bg-destructive/10 rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-medium truncate">{subject.area}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2">{subject.average}%</Badge>
                    {subject.grade && (
                      <span className={`text-[10px] sm:text-xs font-semibold ${subject.grade.color}`}>
                        {subject.grade.label}
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-xs sm:text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table and Graphs - 3 column layout on large screens, stacked on small */}
      {tableData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Performance Table with Dynamic Exam Types */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-3 sm:py-3 md:p-6">
              <CardTitle className="text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                Performance Overview
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                {selectedGradeName && displayTerm && selectedAcademicYear
                  ? `${selectedGradeName} ${displayTerm} ${selectedAcademicYear}${displayExamType ? ` - ${displayExamType}` : ""}`
                  : "Select filters to view performance"}
                {activeFormula && (
                  <span className="ml-1 sm:ml-2 text-primary font-medium">
                    ({activeFormula.name})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-3 md:p-6 md:pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="h-7 py-1 px-2 text-[10px] md:text-sm md:px-4 md:py-2 whitespace-nowrap sticky left-0 bg-background">Subject</TableHead>
                      {activeExamTypes.map(et => (
                        <TableHead key={et.id} className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap">
                          {et.name}
                        </TableHead>
                      ))}
                      <TableHead className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap bg-primary/5">Avg</TableHead>
                      <TableHead className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center whitespace-nowrap bg-primary/5">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((area: any, idx: number) => (
                      <TableRow key={idx} className="border-b hover:bg-muted/50">
                        <TableCell className="h-7 py-1 px-2 text-[10px] md:text-sm md:px-4 md:py-2 font-medium whitespace-nowrap sticky left-0 bg-background">
                          {area.area}
                        </TableCell>
                        {activeExamTypes.map(et => (
                          <TableCell key={et.id} className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center">
                            {area.examScores[et.name] !== null ? area.examScores[et.name] : "-"}
                          </TableCell>
                        ))}
                        <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center font-semibold bg-primary/5">
                          {area.average !== null ? `${area.average}%` : "-"}
                        </TableCell>
                        <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center bg-primary/5">
                          {area.grade ? (
                            <span className={`font-semibold ${area.grade.color}`} title={area.grade.description}>
                              {area.grade.label}
                            </span>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Summary Row */}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="h-7 py-1 px-2 text-[10px] md:text-sm md:px-4 md:py-2 whitespace-nowrap sticky left-0 bg-muted/30">
                        Overall Average
                      </TableCell>
                      {activeExamTypes.map(et => {
                        const examScores = tableData
                          .map((a: any) => a.examScores[et.name])
                          .filter((s: number | null) => s !== null) as number[];
                        const examAvg = examScores.length > 0 
                          ? Math.round((examScores.reduce((a, b) => a + b, 0) / examScores.length) * 10) / 10
                          : null;
                        return (
                          <TableCell key={et.id} className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center">
                            {examAvg !== null ? `${examAvg}%` : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center bg-primary/10">
                        {filteredStats.averageScore}%
                      </TableCell>
                      <TableCell className="h-7 py-1 px-1 text-[10px] md:text-sm md:px-4 md:py-2 text-center bg-primary/10">
                        {averageGrade ? (
                          <span className={`font-semibold ${averageGrade.color}`}>
                            {averageGrade.label}
                          </span>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
        {/* Performance Overview Graph */}
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
              Graph Overview
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm">
              {selectedGradeName && displayTerm && selectedAcademicYear
                ? `${selectedGradeName} ${displayTerm}`
                : "Filter to view"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-3 sm:p-6 pt-0">
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
                        const grade = learnerScore ? getGradeFromScale(learnerScore.value as number) : null;
                        
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
                        const grade = getGradeFromScale(data.average);
                        
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
