import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, UserCheck, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

const Dashboard = () => {
  const { stats, recentAdmissions, gradeDistribution, loading } = useDashboardStats();
  const { user } = useUnifiedAuth();
  const isAdmin = user?.role === "admin";

  const statsDisplay = [
    {
      title: "Total Learners",
      value: loading ? "..." : stats.totalLearners.toString(),
      icon: Users,
      colorClass: "text-primary",
    },
    {
      title: "Active Streams",
      value: loading ? "..." : stats.activeStreams.toString(),
      icon: GraduationCap,
      colorClass: "text-secondary",
    },
    {
      title: "Fee Collection",
      value: loading ? "..." : `KES ${(stats.feeCollection / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      colorClass: "text-success",
    },
    {
      title: "Pending Admissions",
      value: loading ? "..." : stats.pendingAdmissions.toString(),
      icon: UserCheck,
      colorClass: "text-warning",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your school overview.</p>
          </div>
          {isAdmin && (
            <Link to="/activities">
              <Button variant="outline" className="gap-2">
                <Activity className="h-4 w-4" />
                Recent Activities
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsDisplay.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Admissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Admissions</CardTitle>
              <CardDescription>Latest learners enrolled in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentAdmissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No recent admissions</p>
                ) : (
                  recentAdmissions.map((admission, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {admission.first_name?.[0]}{admission.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{admission.first_name} {admission.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {admission.current_grade?.name} - {admission.current_stream?.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(admission.enrollment_date).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Admissions
              </Button>
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Learner enrollment by grade level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradeDistribution.map((grade) => (
                  <div key={grade.grade} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{grade.grade}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{grade.streams} streams</Badge>
                        <span className="font-semibold text-foreground">{grade.learners}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(grade.learners / 220) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button className="h-auto flex-col items-start gap-2 p-4">
                <UserCheck className="h-5 w-5" />
                <span className="font-semibold">New Admission</span>
                <span className="text-xs text-primary-foreground/80">Register a new learner</span>
              </Button>
              <Button variant="secondary" className="h-auto flex-col items-start gap-2 p-4">
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Process Payment</span>
                <span className="text-xs text-secondary-foreground/80">Record fee payment</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                <GraduationCap className="h-5 w-5" />
                <span className="font-semibold">Promote Learners</span>
                <span className="text-xs text-muted-foreground">Grade progression</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                <Users className="h-5 w-5" />
                <span className="font-semibold">View Reports</span>
                <span className="text-xs text-muted-foreground">Analytics & insights</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
