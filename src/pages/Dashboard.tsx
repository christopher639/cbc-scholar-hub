import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, UserCheck, Activity, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const { stats, recentAdmissions, gradeDistribution, loading } = useDashboardStats(dateRange.start, dateRange.end);
  const { user } = useAuth();
  const { schoolInfo } = useSchoolInfo();
  const isAdmin = user?.role === "admin";

  // Get first name based on user role
  const getFirstName = () => {
    if (!user) return "Admin";
    if (user.role === "admin") {
      return user.data?.user_metadata?.full_name?.split(' ')[0] || user.data?.email?.split('@')[0] || "Admin";
    }
    return user.data?.first_name || "User";
  };

  const statsDisplay = [
    {
      title: "Total Learners",
      value: loading ? "..." : (
        <span>
          {stats.totalLearners} <span className="text-sm">Active</span> • {stats.totalAlumni} <span className="text-sm">Alumni</span>
        </span>
      ),
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
      value: loading ? "..." : formatCurrency(stats.feeCollection),
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back {getFirstName()}! Here is your {schoolInfo?.school_name || 'school'} overview.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {dateRange.start && dateRange.end
                        ? `${format(dateRange.start, "PP")} - ${format(dateRange.end, "PP")}`
                        : "Filter by Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-2">
                      <div>
                        <p className="text-sm font-medium mb-2">Start Date</p>
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.start}
                          onSelect={(date) => setDateRange({ ...dateRange, start: date })}
                          className="pointer-events-auto"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">End Date</p>
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.end}
                          onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                          disabled={(date) => dateRange.start ? date < dateRange.start : false}
                          className="pointer-events-auto"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setDateRange({})}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Link to="/activities">
                  <Button variant="outline" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activities
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsDisplay.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
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
              <Link to="/admissions" className="w-full mt-4 block">
                <Button variant="outline" className="w-full">
                  View All Admissions
                </Button>
              </Link>
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
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : gradeDistribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No learners enrolled yet</p>
                ) : (
                  gradeDistribution.map((grade) => (
                    <div key={grade.grade} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-foreground">{grade.grade}</p>
                      </div>
                      <Badge variant="secondary">{grade.learners} learners</Badge>
                    </div>
                  ))
                )}
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
              <Link to="/admissions">
                <Button className="h-auto flex-col items-start gap-2 p-4 w-full">
                  <UserCheck className="h-5 w-5" />
                  <span className="font-semibold">New Admission</span>
                  <span className="text-xs text-primary-foreground/80">Register a new learner</span>
                </Button>
              </Link>
              <Link to="/fees">
                <Button variant="secondary" className="h-auto flex-col items-start gap-2 p-4 w-full">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold">Process Payment</span>
                  <span className="text-xs text-secondary-foreground/80">Record fee payment</span>
                </Button>
              </Link>
              <Link to="/students">
                <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4 w-full">
                  <GraduationCap className="h-5 w-5" />
                  <span className="font-semibold">Promote Learners</span>
                  <span className="text-xs text-muted-foreground">Grade progression</span>
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4 w-full">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">View Reports</span>
                  <span className="text-xs text-muted-foreground">Analytics & insights</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
