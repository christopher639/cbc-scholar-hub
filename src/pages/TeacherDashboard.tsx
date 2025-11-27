import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Users, TrendingUp } from "lucide-react";

export default function TeacherDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    learningAreas: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    averagePerformance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get teacher session from localStorage
      const teacherSession = localStorage.getItem("teacher_session");
      if (!teacherSession) {
        navigate("/auth");
        return;
      }

      // Verify session and get teacher data
      const { data: sessionData, error: sessionError } = await supabase
        .from("teacher_sessions")
        .select("teacher_id")
        .eq("session_token", teacherSession)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (sessionError || !sessionData) {
        localStorage.removeItem("teacher_session");
        navigate("/auth");
        return;
      }

      // Fetch teacher data
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", sessionData.teacher_id)
        .single();

      if (teacherError || !teacherData) {
        console.error("Error fetching teacher:", teacherError);
        toast({
          title: "Error",
          description: "Failed to load teacher information",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setTeacher(teacherData);

      // Get learning areas count for this teacher
      const { count: areasCount } = await supabase
        .from("learning_areas")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacherData.id);

      // Get assignments count for this teacher
      const { count: assignmentsCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacherData.id);

      // Get pending submissions count for this teacher's assignments
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("teacher_id", teacherData.id);

      let pendingCount = 0;
      if (assignments && assignments.length > 0) {
        const { count } = await supabase
          .from("assignment_submissions")
          .select("*", { count: "exact", head: true })
          .in("assignment_id", assignments.map(a => a.id))
          .eq("status", "pending");
        pendingCount = count || 0;
      }

      // Get average performance for this teacher's learning areas
      const { data: performanceData } = await supabase
        .from("performance_records")
        .select("marks")
        .eq("teacher_id", teacherData.id);

      const avgPerformance = performanceData && performanceData.length > 0
        ? performanceData.reduce((sum, p) => sum + Number(p.marks), 0) / performanceData.length
        : 0;

      setStats({
        learningAreas: areasCount || 0,
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
      title: "Avg Performance",
      value: `${stats.averagePerformance}%`,
      icon: TrendingUp,
      description: "Class average",
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
