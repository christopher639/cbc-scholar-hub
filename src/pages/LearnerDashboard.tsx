import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, DollarSign, GraduationCap, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function LearnerDashboard() {
  const { learnerDetails } = useOutletContext<any>();
  const { user } = useAuth();
  const learner = user?.data;
  const [stats, setStats] = useState({
    totalSubjects: 0,
    averageScore: 0,
    feeBalance: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    if (learner) {
      fetchStats();
    }
  }, [learner]);

  const fetchStats = async () => {
    if (!learner) return;

    // Fetch all performance records
    const { data: performance } = await supabase
      .from("performance_records")
      .select("marks")
      .eq("learner_id", learner.id);

    // Fetch all invoices
    const { data: invoices } = await supabase
      .from("student_invoices")
      .select("balance_due")
      .eq("learner_id", learner.id)
      .neq("status", "cancelled");

    const avgScore = performance?.length
      ? performance.reduce((sum, p) => sum + Number(p.marks), 0) / performance.length
      : 0;

    const totalBalance = invoices?.reduce((sum, inv) => sum + Number(inv.balance_due), 0) || 0;

    // Count unique learning areas for subjects count
    const { data: uniqueSubjects } = await supabase
      .from("performance_records")
      .select("learning_area_id")
      .eq("learner_id", learner.id);

    const subjectCount = uniqueSubjects 
      ? new Set(uniqueSubjects.map(s => s.learning_area_id)).size 
      : 0;

    setStats({
      totalSubjects: subjectCount,
      averageScore: Math.round(avgScore),
      feeBalance: totalBalance,
      attendanceRate: 95, // Mock data
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {learnerDetails?.first_name}!</h1>
        <p className="text-muted-foreground">Here's your overview for today</p>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Grade:</span>{" "}
                <span className="font-medium">{learnerDetails?.current_grade?.name}</span>
              </div>
              {learnerDetails?.current_stream && (
                <div>
                  <span className="text-muted-foreground">Stream:</span>{" "}
                  <span className="font-medium">{learnerDetails?.current_stream?.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              From {stats.totalSubjects} subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.feeBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollment</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {learnerDetails?.enrollment_date
                ? format(new Date(learnerDetails.enrollment_date), "MMM dd, yyyy")
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Member since</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-medium">
                {learnerDetails?.date_of_birth
                  ? format(new Date(learnerDetails.date_of_birth), "MMM dd, yyyy")
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-medium capitalize">{learnerDetails?.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Boarding Status:</span>
              <span className="font-medium capitalize">
                {learnerDetails?.boarding_status?.replace("_", " ")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Contact Name</span>
              <p className="font-medium">{learnerDetails?.emergency_contact || "Not set"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Phone Number</span>
              <p className="font-medium">{learnerDetails?.emergency_phone || "Not set"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
