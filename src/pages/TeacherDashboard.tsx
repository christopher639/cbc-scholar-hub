import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Users, TrendingUp, Award } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
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
      description: "Subjects assigned",
    },
    {
      title: "Assignments",
      value: stats.totalAssignments,
      icon: FileText,
      description: "Created",
    },
    {
      title: "Pending",
      value: stats.pendingSubmissions,
      icon: Users,
      description: "Awaiting grading",
    },
    {
      title: "Class Avg",
      value: `${stats.averagePerformance}%`,
      icon: TrendingUp,
      description: "Performance",
    },
  ];

  if (loading) {
    return (
      <div className="w-full px-3 md:px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="p-3 md:p-6 space-y-2">
                <div className="h-3 md:h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="h-6 md:h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
          Welcome, {teacher?.first_name}!
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Overview of your teaching activities
        </p>
      </div>

      {/* Stats Grid - 2 columns on mobile (perfect squares), 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden aspect-square sm:aspect-auto">
              <CardContent className="p-4 sm:p-5 md:p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base md:text-lg font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="text-2xl sm:text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Best Performing Area & Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Best Performing Learning Area */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-5 md:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Award className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500 flex-shrink-0" />
              <span className="truncate">Best Performing Area</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            {bestPerformingArea ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base sm:text-lg md:text-xl font-semibold truncate">{bestPerformingArea.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {bestPerformingArea.code}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{Math.round(bestPerformingArea.average)}%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Class Avg</p>
                  </div>
                  <div>
                    <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${getGradeColor(getGradeCategory(bestPerformingArea.average))}`}>
                      {getGradeCategory(bestPerformingArea.average)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Grade</p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground grid grid-cols-2 gap-x-2">
                  <p>E.E = 80%+</p>
                  <p>M.E = 50-79%</p>
                  <p>A.E = 30-49%</p>
                  <p>B.E = 0-29%</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No performance data</p>
            )}
          </CardContent>
        </Card>

        {/* Class Performance Overview - Radar Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-5 md:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg md:text-xl">Class Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            {classPerformanceData.length > 0 ? (
              <ChartContainer
                config={{
                  average: {
                    label: "Average",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[180px] sm:h-[200px] md:h-[240px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={classPerformanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
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
                            <div className="bg-card border border-border rounded-md p-2 shadow-md text-sm">
                              <p className="font-medium">{data.fullName}</p>
                              <p>Avg: {data.average}%</p>
                              <p className={`font-medium ${getGradeColor(getGradeCategory(data.average))}`}>
                                {getGradeCategory(data.average)}
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
              <p className="text-sm text-muted-foreground text-center py-8">No performance data</p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-5 md:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg md:text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6 pt-0 grid grid-cols-3 gap-3 sm:gap-4">
          <button
            onClick={() => navigate("/teacher-portal/marks")}
            className="p-3 sm:p-4 md:p-6 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 mb-2 text-primary" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold">Post Marks</h3>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Enter records
            </p>
          </button>
          <button
            onClick={() => navigate("/teacher-portal/assignments")}
            className="p-3 sm:p-4 md:p-6 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 mb-2 text-primary" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold">Assignments</h3>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Post new
            </p>
          </button>
          <button
            onClick={() => navigate("/teacher-portal/profile")}
            className="p-3 sm:p-4 md:p-6 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 mb-2 text-primary" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold">Profile</h3>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Your info
            </p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
