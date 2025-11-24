import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Award, AlertCircle, Target, DollarSign, Users } from "lucide-react";
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
  const [feeBalance, setFeeBalance] = useState(0);
  const [position, setPosition] = useState<{ grade: number; stream: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (learner) {
      fetchAllData();
    }
  }, [learner]);

  const fetchAllData = async () => {
    if (!learner) return;

    try {
      setLoading(true);
      
      // Fetch performance data
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

      // Calculate position/rank
      if (performanceData && performanceData.length > 0 && learner.current_grade_id && learner.current_stream_id) {
        const currentPeriod = performanceData[0];
        
        // Get all learners in grade
        const { data: gradePerformance } = await supabase
          .from("performance_records")
          .select("learner_id, marks")
          .eq("grade_id", learner.current_grade_id)
          .eq("academic_year", currentPeriod.academic_year)
          .eq("term", currentPeriod.term);

        // Get all learners in stream
        const { data: streamPerformance } = await supabase
          .from("performance_records")
          .select("learner_id, marks")
          .eq("stream_id", learner.current_stream_id)
          .eq("academic_year", currentPeriod.academic_year)
          .eq("term", currentPeriod.term);

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

          return averages.findIndex(l => l.learner_id === learner.id) + 1;
        };

        setPosition({
          grade: gradePerformance ? calculatePosition(gradePerformance) : 0,
          stream: streamPerformance ? calculatePosition(streamPerformance) : 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
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

  const tableData = Object.values(groupedPerformance).map((area: any) => {
    const scores = [area.opener, area.midterm, area.final].filter(s => s !== null);
    const average = scores.length > 0 
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length 
      : null;
    
    return {
      ...area,
      average: average !== null ? Math.round(average * 10) / 10 : null,
    };
  });

  const chartData = tableData.map(area => ({
    code: area.code,
    area: area.area,
    average: area.average || 0
  }));

  // Best and weakest subjects
  const sortedByAverage = [...tableData].filter(a => a.average !== null).sort((a, b) => (b.average || 0) - (a.average || 0));
  const bestSubjects = sortedByAverage.slice(0, 3);
  const weakestSubjects = sortedByAverage.slice(-3).reverse();

  return (
    <div className="w-full min-h-screen px-3 md:px-6 pt-2 pb-4 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {learnerDetails?.first_name}!
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">Here's your academic overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Subjects</p>
                <p className="text-xl font-bold">{stats.totalSubjects}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-xl font-bold">{stats.averageScore}%</p>
              </div>
              <Target className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Position</p>
                <p className="text-sm font-bold">
                  {position ? `${position.stream} / Stream` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {position ? `${position.grade} / Grade` : ""}
                </p>
              </div>
              <Users className="h-6 w-6 text-primary" />
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

      {/* Performance Graph */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Overview
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

      {/* Performance Table */}
      {tableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Performance</CardTitle>
            <CardDescription>
              Scores by exam type - {selectedYear} {selectedTerm && `- ${selectedTerm.replace("term_", "Term ")}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Opener</TableHead>
                    <TableHead className="text-center">Mid-Term</TableHead>
                    <TableHead className="text-center">Final</TableHead>
                    <TableHead className="text-center">Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((area: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{area.area}</TableCell>
                      <TableCell className="text-center">{area.opener ?? "-"}</TableCell>
                      <TableCell className="text-center">{area.midterm ?? "-"}</TableCell>
                      <TableCell className="text-center">{area.final ?? "-"}</TableCell>
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
      )}
    </div>
  );
}
