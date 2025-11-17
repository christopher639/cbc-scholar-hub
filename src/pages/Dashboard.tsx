import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, UserCheck, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Students",
      value: "1,247",
      icon: Users,
      trend: { value: "12%", positive: true },
      colorClass: "text-primary",
    },
    {
      title: "Active Streams",
      value: "18",
      icon: GraduationCap,
      colorClass: "text-secondary",
    },
    {
      title: "Fee Collection",
      value: "KES 4.2M",
      icon: DollarSign,
      trend: { value: "8%", positive: true },
      colorClass: "text-success",
    },
    {
      title: "Pending Admissions",
      value: "23",
      icon: UserCheck,
      colorClass: "text-warning",
    },
  ];

  const recentAdmissions = [
    { name: "John Kamau", grade: "Grade 4", stream: "Green", date: "2024-11-15" },
    { name: "Mary Wanjiku", grade: "Grade 1", stream: "Red", date: "2024-11-14" },
    { name: "David Omondi", grade: "Grade 3", stream: "Blue", date: "2024-11-14" },
    { name: "Grace Akinyi", grade: "Grade 2", stream: "Yellow", date: "2024-11-13" },
  ];

  const gradeDistribution = [
    { grade: "Grade 1", students: 215, streams: 3 },
    { grade: "Grade 2", students: 208, streams: 3 },
    { grade: "Grade 3", students: 198, streams: 3 },
    { grade: "Grade 4", students: 195, streams: 3 },
    { grade: "Grade 5", students: 218, streams: 3 },
    { grade: "Grade 6", students: 213, streams: 3 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your school overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Admissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Admissions</CardTitle>
              <CardDescription>Latest students enrolled in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAdmissions.map((admission, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {admission.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{admission.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {admission.grade} - {admission.stream}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{admission.date}</span>
                  </div>
                ))}
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
              <CardDescription>Student enrollment by grade level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradeDistribution.map((grade) => (
                  <div key={grade.grade} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{grade.grade}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{grade.streams} streams</Badge>
                        <span className="font-semibold text-foreground">{grade.students}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(grade.students / 220) * 100}%` }}
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button className="h-auto flex-col items-start gap-2 p-4">
                <UserCheck className="h-5 w-5" />
                <span className="font-semibold">New Admission</span>
                <span className="text-xs text-primary-foreground/80">Register a new student</span>
              </Button>
              <Button variant="secondary" className="h-auto flex-col items-start gap-2 p-4">
                <DollarSign className="h-5 w-5" />
                <span className="font-semibold">Process Payment</span>
                <span className="text-xs text-secondary-foreground/80">Record fee payment</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                <GraduationCap className="h-5 w-5" />
                <span className="font-semibold">Promote Students</span>
                <span className="text-xs text-muted-foreground">Grade progression</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                <AlertCircle className="h-5 w-5" />
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
