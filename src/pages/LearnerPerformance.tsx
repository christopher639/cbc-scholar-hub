import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useExamTypes } from "@/hooks/useExamTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen } from "lucide-react";

export default function LearnerPerformance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { examTypes } = useExamTypes();
  const learner = user?.data;
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  // Get active exam types sorted by display order
  const activeExamTypes = examTypes
    .filter(et => et.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  useEffect(() => {
    if (learner) {
      fetchPerformance();
    }
  }, [learner]);

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
  const groupedPerformance = filteredPerformance.reduce((acc: any, record) => {
    const areaName = record.learning_area?.name || "Unknown";
    const areaCode = record.learning_area?.code || "N/A";
    if (!acc[areaName]) {
      acc[areaName] = {
        area: areaName,
        code: areaCode,
        examScores: {} as Record<string, number | null>,
      };
      // Initialize all exam types to null
      activeExamTypes.forEach(et => {
        acc[areaName].examScores[et.name] = null;
      });
    }
    
    // Match exam type (case-insensitive)
    const recordExamType = record.exam_type?.toLowerCase();
    const matchedExamType = activeExamTypes.find(
      et => et.name.toLowerCase() === recordExamType
    );
    
    if (matchedExamType) {
      acc[areaName].examScores[matchedExamType.name] = record.marks;
    }
    
    return acc;
  }, {});

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

  // Chart data
  const chartData = tableData.map(area => ({
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
                        <TableHead key={et.id} className="text-center">{et.name}</TableHead>
                      ))}
                      <TableHead className="text-center">Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((area: any) => (
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
                      </TableRow>
                    ))}
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
