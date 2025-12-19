import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useExamTypes } from "@/hooks/useExamTypes";
import { useGradingScales } from "@/hooks/useGradingScales";
import { usePerformanceFormulas } from "@/hooks/usePerformanceFormulas";
import { useLearningAreaRegistration } from "@/hooks/useLearningAreaRegistration";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function LearnerPerformance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { examTypes } = useExamTypes();
  const { gradingScales, getGrade } = useGradingScales();
  const { activeFormula, getFormulaWeights, calculateWeightedAverage } = usePerformanceFormulas();
  const { getAllRegisteredLearningAreas } = useLearningAreaRegistration();
  const learner = user?.data;
  const [performance, setPerformance] = useState<any[]>([]);
  const [registeredLearningAreas, setRegisteredLearningAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  // Fetch released marks
  const { data: releases = [] } = useQuery({
    queryKey: ["performance-releases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_releases")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Check if marks are released for given filters
  const isReleased = (year: string, term: string, examType: string) => {
    if (!learner) return false;
    return releases.some((r: any) => {
      const matchesYear = r.academic_year === year;
      const matchesTerm = r.term === term;
      const matchesExam = r.exam_type.toLowerCase() === examType.toLowerCase();
      const matchesScope = !r.grade_id || r.grade_id === learner.current_grade_id;
      const matchesStream = !r.stream_id || r.stream_id === learner.current_stream_id;
      return matchesYear && matchesTerm && matchesExam && matchesScope && matchesStream;
    });
  };

  // Get ALL active exam types sorted by display order (show all columns)
  const activeExamTypes = examTypes
    .filter(et => et.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  useEffect(() => {
    if (learner) {
      fetchPerformance();
    }
  }, [learner]);

  // Fetch registered learning areas when year changes
  useEffect(() => {
    if (learner && selectedYear) {
      const gradeId = learner.current_grade_id;
      if (gradeId) {
        const registered = getAllRegisteredLearningAreas(learner.id, gradeId, selectedYear);
        setRegisteredLearningAreas(registered);
      }
    }
  }, [learner, selectedYear, getAllRegisteredLearningAreas]);

  const fetchPerformance = async () => {
    if (!learner) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("performance_records")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          academic_period:academic_periods(academic_year, term)
        `)
        .eq("learner_id", learner.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setPerformance(data || []);
      
      // Set default filters to current period
      if (data && data.length > 0) {
        const latest = data[0];
        if (latest.academic_year && !selectedYear) {
          setSelectedYear(latest.academic_year);
        }
        if (latest.term && !selectedTerm) {
          setSelectedTerm(latest.term);
        }
      }
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

  // Get unique years and terms
  const uniqueYears = [...new Set(performance.map(p => p.academic_year))].filter(Boolean);
  const uniqueTerms = ["term_1", "term_2", "term_3"];

  // Filter performance
  const filteredPerformance = performance.filter(record => {
    if (selectedYear && record.academic_year !== selectedYear) return false;
    if (selectedTerm && record.term !== selectedTerm) return false;
    return true;
  });

  // Group by learning area with ALL exam types as columns
  const groupedPerformance = (() => {
    const acc: any = {};
    
    // First, add all registered learning areas (even without marks)
    registeredLearningAreas.forEach(reg => {
      const la = reg.learning_area;
      if (la && !acc[la.name]) {
        acc[la.name] = {
          area: la.name,
          code: la.code,
          examScores: {} as Record<string, number | null>,
          source: reg.source,
        };
        // Initialize ALL active exam types
        activeExamTypes.forEach(et => {
          acc[la.name].examScores[et.name] = null;
        });
      }
    });
    
    // Then add marks from performance records (only if released)
    filteredPerformance.forEach(record => {
      const areaName = record.learning_area?.name || "Unknown";
      const areaCode = record.learning_area?.code || "N/A";
      
      // Only include if registered OR if no registrations exist
      const isRegistered = registeredLearningAreas.length === 0 || 
        registeredLearningAreas.some(r => r.learning_area?.name === areaName);
      
      if (!isRegistered) return;
      
      if (!acc[areaName]) {
        acc[areaName] = {
          area: areaName,
          code: areaCode,
          examScores: {} as Record<string, number | null>,
        };
        // Initialize ALL active exam types
        activeExamTypes.forEach(et => {
          acc[areaName].examScores[et.name] = null;
        });
      }
      
      // Match exam type - only add marks if RELEASED
      const recordExamType = record.exam_type?.toLowerCase();
      const matchedExamType = activeExamTypes.find(
        et => et.name.toLowerCase() === recordExamType
      );
      
      if (matchedExamType && isReleased(selectedYear, selectedTerm, matchedExamType.name)) {
        acc[areaName].examScores[matchedExamType.name] = record.marks;
      }
    });
    
    return acc;
  })();

  // Prepare exam types data for weighted average calculation
  const examTypesForCalc = activeExamTypes.map(et => ({
    id: et.id,
    name: et.name,
    max_marks: et.max_marks || 100,
  }));

  const tableData = Object.values(groupedPerformance).map((area: any) => {
    // Use weighted average calculation from formula if available
    const average = calculateWeightedAverage(area.examScores, examTypesForCalc);
    
    return {
      ...area,
      average: average !== null ? Math.round(average * 10) / 10 : null,
    };
  });

  // Chart data (only include areas with marks for the chart)
  const chartData = tableData
    .filter(area => area.average !== null)
    .map(area => ({
      code: area.code,
      area: area.area,
      average: area.average || 0
    }));

  const getTermLabel = (term: string) => {
    const termMap: Record<string, string> = {
      term_1: "Term 1",
      term_2: "Term 2",
      term_3: "Term 3",
    };
    return termMap[term] || term;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Fixed Header Section */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/30 px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Academic Performance</h1>
              <p className="text-sm text-muted-foreground">Your exam results and grades</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 sm:gap-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px] sm:w-[150px] h-9 text-sm bg-card">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[100px] sm:w-[130px] h-9 text-sm bg-card">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTerms.map(term => (
                    <SelectItem key={term} value={term}>{getTermLabel(term)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="px-3 sm:px-4 py-4 space-y-4 max-w-7xl mx-auto">
        {tableData.length > 0 ? (
          <>
            {/* Graph Overview - Hidden on very small screens */}
            {chartData.length > 0 && (
              <Card className="hidden sm:block shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="code" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                                <p className="font-semibold text-sm">{payload[0].payload.area}</p>
                                <p className="text-sm text-muted-foreground">Average: {payload[0].value}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Performance Table */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="p-3 sm:p-4 border-b border-border/30 bg-muted/30">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  {selectedYear} {selectedTerm && `• ${getTermLabel(selectedTerm)}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="text-xs sm:text-sm font-semibold sticky left-0 bg-muted/20 z-10 min-w-[100px] sm:min-w-[140px] py-2 px-2 sm:px-3">Subject</TableHead>
                        {activeExamTypes.map(et => {
                          const released = isReleased(selectedYear, selectedTerm, et.name);
                          return (
                            <TableHead key={et.id} className="text-center text-xs sm:text-sm font-semibold px-1 sm:px-2 min-w-[50px] sm:min-w-[65px] py-2">
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-0.5">
                                  <span className="truncate max-w-[40px] sm:max-w-none">{et.name}</span>
                                  {!released && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                                </div>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">/{et.max_marks || 100}</span>
                              </div>
                            </TableHead>
                          );
                        })}
                        <TableHead className="text-center text-xs sm:text-sm font-semibold min-w-[45px] sm:min-w-[55px] py-2 px-1 sm:px-2">Avg</TableHead>
                        <TableHead className="text-center text-xs sm:text-sm font-semibold min-w-[45px] sm:min-w-[55px] py-2 px-1 sm:px-2">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((area: any, idx: number) => {
                        const gradeInfo = area.average ? getGrade(area.average) : null;
                        return (
                          <TableRow key={area.area} className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                            <TableCell className="font-medium text-xs sm:text-sm sticky left-0 z-10 py-2 px-2 sm:px-3 truncate max-w-[100px] sm:max-w-[140px]" style={{ backgroundColor: idx % 2 === 0 ? "hsl(var(--background))" : "hsl(var(--muted) / 0.1)" }}>
                              {area.area}
                            </TableCell>
                            {activeExamTypes.map(et => {
                              const released = isReleased(selectedYear, selectedTerm, et.name);
                              const score = area.examScores[et.name];
                              return (
                                <TableCell key={et.id} className="text-center text-xs sm:text-sm py-2 px-1 sm:px-2">
                                  {released ? (
                                    <span className={score !== null ? "font-medium" : "text-muted-foreground"}>{score ?? "-"}</span>
                                  ) : (
                                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-auto" />
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold text-xs sm:text-sm py-2 px-1 sm:px-2">
                              <span className={area.average !== null ? "text-primary" : "text-muted-foreground"}>{area.average ?? "-"}</span>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 sm:px-2">
                              {gradeInfo ? (
                                <Badge variant="outline" className="font-semibold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                                  {gradeInfo.grade_name}
                                </Badge>
                              ) : <span className="text-muted-foreground text-xs">-</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <BookOpen className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No performance records yet</h3>
                <p className="text-sm text-muted-foreground">Your exam results will appear here once available</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
