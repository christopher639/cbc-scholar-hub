import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useExamTypes } from "@/hooks/useExamTypes";
import { useGradingScales } from "@/hooks/useGradingScales";
import { useLearningAreaRegistration } from "@/hooks/useLearningAreaRegistration";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function LearnerPerformance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { examTypes } = useExamTypes();
  const { gradingScales, getGrade } = useGradingScales();
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

  // Get active exam types sorted by display order
  const activeExamTypes = examTypes
    .filter(et => et.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  // Filter to only show released exam types
  const releasedExamTypes = activeExamTypes.filter(et => 
    isReleased(selectedYear, selectedTerm, et.name)
  );

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

  // Group by learning area with dynamic exam types
  // Use registered learning areas if available, otherwise use performance records
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
        releasedExamTypes.forEach(et => {
          acc[la.name].examScores[et.name] = null;
        });
      }
    });
    
    // Then add marks from performance records
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
        releasedExamTypes.forEach(et => {
          acc[areaName].examScores[et.name] = null;
        });
      }
      
      // Match exam type only if released
      const recordExamType = record.exam_type?.toLowerCase();
      const matchedExamType = releasedExamTypes.find(
        et => et.name.toLowerCase() === recordExamType
      );
      
      if (matchedExamType) {
        acc[areaName].examScores[matchedExamType.name] = record.marks;
      }
    });
    
    return acc;
  })();

  const tableData = Object.values(groupedPerformance).map((area: any) => {
    // Calculate average based on exam types with actual marks
    const scores = Object.values(area.examScores).filter((s): s is number => s !== null);
    const average = scores.length > 0 
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length 
      : null;
    
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Academic Performance</h1>
        <p className="text-muted-foreground">Your exam results and grades</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {uniqueYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent>
            {uniqueTerms.map(term => (
              <SelectItem key={term} value={term}>{getTermLabel(term)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tableData.length > 0 ? (
        <>
          {/* Graph Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                            <p className="font-semibold">{payload[0].payload.area}</p>
                            <p className="text-sm">Average: {payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="linear" dataKey="average" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Performance Records - {selectedYear} {selectedTerm && `- ${getTermLabel(selectedTerm)}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learning Area</TableHead>
                      {activeExamTypes.map(et => (
                        <TableHead key={et.id} className="text-center">
                          {et.name}
                          <span className="text-xs text-muted-foreground block">/{et.max_marks || 100}</span>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Average</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((area: any) => {
                      const gradeInfo = area.average ? getGrade(area.average) : null;
                      return (
                        <TableRow key={area.area}>
                          <TableCell className="font-medium">{area.area}</TableCell>
                          {activeExamTypes.map(et => (
                            <TableCell key={et.id} className="text-center">
                              {area.examScores[et.name] ?? "-"}
                            </TableCell>
                          ))}
                          <TableCell className="text-center font-semibold">
                            {area.average ?? "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {gradeInfo ? (
                              <Badge variant="outline" className="font-semibold">
                                {gradeInfo.grade_name}
                              </Badge>
                            ) : "-"}
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
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No performance records yet</h3>
              <p className="text-muted-foreground">Your exam results will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
