import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Users, TrendingUp, Award } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface OutletContext {
  teacher: any;
}

// Grading function
const getGradeCategory = (marks: number): string => {
  if (marks >= 80) return "E.E";
  if (marks >= 50) return "M.E";
  if (marks >= 30) return "A.E";
  return "B.E";
};

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case "E.E": return "text-green-600";
    case "M.E": return "text-blue-600";
    case "A.E": return "text-yellow-600";
    case "B.E": return "text-red-600";
    default: return "text-muted-foreground";
  }
};

export default function TeacherDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { teacher } = useOutletContext<OutletContext>();
  const [stats, setStats] = useState({
    learningAreas: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    averagePerformance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bestPerformingArea, setBestPerformingArea] = useState<any>(null);
  const [classPerformanceData, setClassPerformanceData] = useState<any[]>([]);
  const [performanceOverTime, setPerformanceOverTime] = useState<any[]>([]);

  useEffect(() => {
    if (teacher) {
      fetchDashboardData();
    }
  }, [teacher]);

  const fetchDashboardData = async () => {
    if (!teacher) return;
    
    try {
      // Get learning areas for this teacher
      const { data: learningAreas, error: areasError } = await supabase
        .from("learning_areas")
        .select("id, name, code")
        .eq("teacher_id", teacher.id);

      if (areasError) throw areasError;

      // Get assignments count for this teacher
      const { count: assignmentsCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacher.id);

      // Get pending submissions count for this teacher's assignments
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("teacher_id", teacher.id);

      let pendingCount = 0;
      if (assignments && assignments.length > 0) {
        const { count } = await supabase
          .from("assignment_submissions")
          .select("*", { count: "exact", head: true })
          .in("assignment_id", assignments.map(a => a.id))
          .eq("status", "pending");
        pendingCount = count || 0;
      }

      // Get performance data for this teacher's learning areas
      const { data: performanceData } = await supabase
        .from("performance_records")
        .select(`
          marks,
          academic_year,
          term,
          learning_area_id,
          learning_areas!inner(id, name, code)
        `)
        .eq("teacher_id", teacher.id);

      // Calculate average performance
      const avgPerformance = performanceData && performanceData.length > 0
        ? performanceData.reduce((sum, p) => sum + Number(p.marks), 0) / performanceData.length
        : 0;

      // Calculate best performing learning area
      if (performanceData && performanceData.length > 0) {
        const areaPerformance: Record<string, { total: number; count: number; name: string; code: string }> = {};
        
        performanceData.forEach((record: any) => {
          const areaId = record.learning_area_id;
          if (!areaPerformance[areaId]) {
            areaPerformance[areaId] = {
              total: 0,
              count: 0,
              name: record.learning_areas?.name || 'Unknown',
              code: record.learning_areas?.code || 'N/A',
            };
          }
          areaPerformance[areaId].total += Number(record.marks);
          areaPerformance[areaId].count += 1;
        });

        let bestArea = null;
        let highestAvg = 0;

        Object.entries(areaPerformance).forEach(([id, data]) => {
          const avg = data.total / data.count;
          if (avg > highestAvg) {
            highestAvg = avg;
            bestArea = { id, ...data, average: avg };
          }
        });

        setBestPerformingArea(bestArea);

        // Prepare class performance data for radar chart
        const radarData = Object.entries(areaPerformance).map(([id, data]) => ({
          subject: data.code,
          fullName: data.name,
          average: Math.round(data.total / data.count),
        }));
        setClassPerformanceData(radarData);

        // Prepare performance over time data
        const timePerformance: Record<string, { total: number; count: number }> = {};
        performanceData.forEach((record: any) => {
          const key = `${record.academic_year} ${record.term?.replace('_', ' ')}`;
          if (!timePerformance[key]) {
            timePerformance[key] = { total: 0, count: 0 };
          }
          timePerformance[key].total += Number(record.marks);
          timePerformance[key].count += 1;
        });

        const timeData = Object.entries(timePerformance)
          .map(([period, data]) => ({
            period,
            average: Math.round(data.total / data.count),
          }))
          .sort((a, b) => a.period.localeCompare(b.period));
        
        setPerformanceOverTime(timeData);
      }

      setStats({
        learningAreas: learningAreas?.length || 0,
        totalAssignments: assignmentsCount || 0,
        pendingSubmissions: pendingCount,
        averagePerformance: Math.round(avgPerformance),
      });
    } catch (error: any) {
      console.error("Dashboard error:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Learning Areas",
      value: stats.learningAreas,
      icon: BookOpen,
      description: "Subjects assigned to you",
    },
    {
      title: "Total Assignments",
      value: stats.totalAssignments,
      icon: FileText,
      description: "Created assignments",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingSubmissions,
      icon: Users,
      description: "Awaiting grading",
    },
    {
      title: "Class Average",
      value: `${stats.averagePerformance}%`,
      icon: TrendingUp,
      description: "Overall performance",
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {teacher?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your teaching activities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Best Performing Area & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Best Performing Learning Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Best Performing Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestPerformingArea ? (
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{bestPerformingArea.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {bestPerformingArea.code}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-3xl font-bold">{Math.round(bestPerformingArea.average)}%</p>
                    <p className="text-xs text-muted-foreground">Class Average</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${getGradeColor(getGradeCategory(bestPerformingArea.average))}`}>
                      {getGradeCategory(bestPerformingArea.average)}
                    </p>
                    <p className="text-xs text-muted-foreground">Grade</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <p>E.E = Exceeding (80%+)</p>
                  <p>M.E = Meeting (50-79%)</p>
                  <p>A.E = Approaching (30-49%)</p>
                  <p>B.E = Below (0-29%)</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No performance data available</p>
            )}
          </CardContent>
        </Card>

        {/* Class Performance Overview - Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {classPerformanceData.length > 0 ? (
              <ChartContainer
                config={{
                  average: {
                    label: "Average",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={classPerformanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Class Average"
                      dataKey="average"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <ChartTooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-md p-2 shadow-md">
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-sm">Average: {data.average}%</p>
                              <p className={`text-sm font-medium ${getGradeColor(getGradeCategory(data.average))}`}>
                                Grade: {getGradeCategory(data.average)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">No performance data available</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceOverTime.length > 0 ? (
              <ChartContainer
                config={{
                  average: {
                    label: "Average",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 9 }} 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-md p-2 shadow-md">
                              <p className="font-medium text-xs">{data.period}</p>
                              <p className="text-sm">Average: {data.average}%</p>
                              <p className={`text-sm font-medium ${getGradeColor(getGradeCategory(data.average))}`}>
                                Grade: {getGradeCategory(data.average)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">No historical data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/teacher-portal/marks")}
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <BookOpen className="h-6 w-6 mb-2 text-primary" />
            <h3 className="font-semibold">Post Marks</h3>
            <p className="text-sm text-muted-foreground">
              Enter performance records
            </p>
          </button>
          <button
            onClick={() => navigate("/teacher-portal/assignments")}
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <FileText className="h-6 w-6 mb-2 text-primary" />
            <h3 className="font-semibold">Create Assignment</h3>
            <p className="text-sm text-muted-foreground">
              Post new assignments
            </p>
          </button>
          <button
            onClick={() => navigate("/teacher-portal/profile")}
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Users className="h-6 w-6 mb-2 text-primary" />
            <h3 className="font-semibold">View Profile</h3>
            <p className="text-sm text-muted-foreground">
              Manage your information
            </p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
