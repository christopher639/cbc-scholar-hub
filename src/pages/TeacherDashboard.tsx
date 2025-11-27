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
    <div className="w-full px-3 md:px-6 py-4 space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-3xl font-bold">
          Welcome, {teacher?.first_name}!
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Overview of your teaching activities
        </p>
      </div>

      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-6 pb-1 md:pb-2">
                <CardTitle className="text-[10px] md:text-sm font-medium truncate">
                  {stat.title}
                </CardTitle>
                <Icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                <p className="text-[9px] md:text-xs text-muted-foreground truncate">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Best Performing Area & Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Best Performing Learning Area */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Award className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              Best Performing Area
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {bestPerformingArea ? (
              <div className="space-y-2 md:space-y-3">
                <div>
                  <p className="text-sm md:text-lg font-semibold truncate">{bestPerformingArea.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Code: {bestPerformingArea.code}</p>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div>
                    <p className="text-xl md:text-3xl font-bold">{Math.round(bestPerformingArea.average)}%</p>
                    <p className="text-[9px] md:text-xs text-muted-foreground">Class Average</p>
                  </div>
                  <div>
                    <p className={`text-lg md:text-2xl font-bold ${getGradeColor(getGradeCategory(bestPerformingArea.average))}`}>
                      {getGradeCategory(bestPerformingArea.average)}
                    </p>
                    <p className="text-[9px] md:text-xs text-muted-foreground">Grade</p>
                  </div>
                </div>
                <div className="text-[8px] md:text-xs text-muted-foreground grid grid-cols-2 gap-x-2">
                  <p>E.E = Exceeding (80%+)</p>
                  <p>M.E = Meeting (50-79%)</p>
                  <p>A.E = Approaching (30-49%)</p>
                  <p>B.E = Below (0-29%)</p>
                </div>
              </div>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground">No performance data available</p>
            )}
          </CardContent>
        </Card>

        {/* Class Performance Overview - Radar Chart */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-sm md:text-base">Class Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {classPerformanceData.length > 0 ? (
              <ChartContainer
                config={{
                  average: {
                    label: "Average",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[160px] md:h-[220px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={classPerformanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
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
                            <div className="bg-card border border-border rounded-md p-2 shadow-md text-xs">
                              <p className="font-medium">{data.fullName}</p>
                              <p>Average: {data.average}%</p>
                              <p className={`font-medium ${getGradeColor(getGradeCategory(data.average))}`}>
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
              <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-10">No performance data</p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="p-3 md:p-6 pb-2">
          <CardTitle className="text-sm md:text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0 grid grid-cols-3 gap-2 md:gap-4">
          <button
            onClick={() => navigate("/teacher-portal/marks")}
            className="p-2 md:p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <BookOpen className="h-4 w-4 md:h-6 md:w-6 mb-1 md:mb-2 text-primary" />
            <h3 className="text-xs md:text-base font-semibold">Post Marks</h3>
            <p className="text-[9px] md:text-sm text-muted-foreground hidden sm:block">
              Enter performance records
            </p>
          </button>
          <button
            onClick={() => navigate("/teacher-portal/assignments")}
            className="p-2 md:p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <FileText className="h-4 w-4 md:h-6 md:w-6 mb-1 md:mb-2 text-primary" />
            <h3 className="text-xs md:text-base font-semibold">Assignments</h3>
            <p className="text-[9px] md:text-sm text-muted-foreground hidden sm:block">
              Post new assignments
            </p>
          </button>
          <button
            onClick={() => navigate("/teacher-portal/profile")}
            className="p-2 md:p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Users className="h-4 w-4 md:h-6 md:w-6 mb-1 md:mb-2 text-primary" />
            <h3 className="text-xs md:text-base font-semibold">Profile</h3>
            <p className="text-[9px] md:text-sm text-muted-foreground hidden sm:block">
              Manage your info
            </p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
