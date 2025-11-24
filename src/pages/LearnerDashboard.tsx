import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function LearnerDashboard() {
  const { learnerDetails } = useOutletContext<any>();
  const { user } = useAuth();
  const learner = user?.data;
  
  const [stats, setStats] = useState({
    totalSubjects: 0,
    averageScore: 0,
  });
  const [performance, setPerformance] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  useEffect(() => {
    if (learner) {
      fetchStats();
    }
  }, [learner]);

  const fetchStats = async () => {
    if (!learner) return;

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

    // Set default filters
    if (performanceData && performanceData.length > 0) {
      const latest = performanceData[0];
      if (!selectedYear && latest.academic_year) {
        setSelectedYear(latest.academic_year);
      }
      if (!selectedTerm && latest.term) {
        setSelectedTerm(latest.term);
      }
    }

    const avgScore = performanceData?.length
      ? performanceData.reduce((sum, p) => sum + Number(p.marks), 0) / performanceData.length
      : 0;

    const subjectCount = performanceData 
      ? new Set(performanceData.map(p => p.learning_area_id)).size 
      : 0;

    setStats({
      totalSubjects: subjectCount,
      averageScore: Math.round(avgScore),
    });
  };

  const filteredPerformance = performance.filter(record => {
    if (selectedYear && record.academic_year !== selectedYear) return false;
    if (selectedTerm && record.term !== selectedTerm) return false;
    return true;
  });

  const uniqueYears = [...new Set(performance.map(p => p.academic_year))].filter(Boolean);
  const uniqueTerms = ["term_1", "term_2", "term_3"];

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

  const chartData = Object.values(groupedPerformance).map((area: any) => {
    const scores = [area.opener, area.midterm, area.final].filter((s: any) => s !== null);
    const average = scores.length > 0 
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length 
      : null;
    
    return {
      code: area.code,
      area: area.area,
      average: average !== null ? Math.round(average * 10) / 10 : 0,
    };
  });

  return (
    <div className="w-full min-h-screen px-3 md:px-6 pt-2 pb-4 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {learnerDetails?.first_name}!
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">Here's your academic overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold">{stats.totalSubjects}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Academic Performance
              </CardTitle>
              <CardDescription>
                {selectedYear && selectedTerm 
                  ? `${selectedYear} - ${selectedTerm.replace("term_", "Term ")}`
                  : "Filter to view performance"}
              </CardDescription>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
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
        </CardHeader>
        
        <CardContent>
          {filteredPerformance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No performance records for selected filters</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
