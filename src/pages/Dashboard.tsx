import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { StatCard } from "@/components/Dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, UserCheck, Activity, Calendar, TrendingDown, Home, Building2 } from "lucide-react";
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
import { formatCurrencyCompact } from "@/lib/currency";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const { stats, recentAdmissions, gradeDistribution, houseDistribution, departmentDistribution, recentPayments, balanceByGrade, loading } = useDashboardStats(dateRange.start, dateRange.end);
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
      title: "Paid",
      value: loading ? "..." : formatCurrencyCompact(stats.feeCollection),
      icon: DollarSign,
      colorClass: "text-success",
    },
    {
      title: "Balance",
      value: loading ? "..." : formatCurrencyCompact(stats.uncollectedBalance),
      icon: TrendingDown,
      colorClass: "text-destructive",
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
                    <Button variant="outline" className="gap-2 text-xs sm:text-sm">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {dateRange.start && dateRange.end
                          ? `${format(dateRange.start, "PP")} - ${format(dateRange.end, "PP")}`
                          : "Filter by Date"}
                      </span>
                      <span className="sm:hidden">
                        {dateRange.start && dateRange.end
                          ? `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d")}`
                          : "Date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="end">
                    <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
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

        {/* Stats Grid - Hidden on mobile, shown on large screens at top */}
        <div className="hidden lg:grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
          {statsDisplay.map((stat, index) => (
            <div 
              key={stat.title} 
              className={cn(
                // First two cards (Total Learners, Active Streams) span full width on mobile
                index < 2 && "col-span-2 sm:col-span-1",
                // Fee Collection and Uncollected Balance (index 2 and 3) stay side by side
                (index === 2 || index === 3) && "col-span-1",
                // Pending Admissions spans full width on mobile
                index === 4 && "col-span-2 sm:col-span-1"
              )}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Mobile: Recent Payments first, Desktop: stays at bottom */}
        <div className="lg:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest fee transactions recorded in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {loading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </>
                ) : recentPayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 col-span-full">No recent payments</p>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm flex items-center gap-1 truncate">
                            {payment.learner?.first_name} {payment.learner?.last_name}
                            <Badge 
                              variant={
                                payment.status === 'paid' ? 'default' :
                                payment.status === 'partial' ? 'secondary' :
                                payment.status === 'overdue' ? 'destructive' : 'outline'
                              }
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                payment.status === 'paid' && "bg-primary text-primary-foreground",
                                payment.status === 'partial' && "bg-warning text-warning-foreground"
                              )}
                            >
                              {payment.status || 'pending'}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {payment.payment_method || 'N/A'} {payment.receipt_number ? `• ${payment.receipt_number}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-primary text-sm">{formatCurrencyCompact(payment.amount_paid)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Uncollected Balance by Grade */}
          <Card>
            <CardHeader>
              <CardTitle>Uncollected Balance by Grade</CardTitle>
              <CardDescription>Outstanding fees breakdown by grade level</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : balanceByGrade.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No outstanding balances</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={balanceByGrade}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${formatCurrencyCompact(value)}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatCurrencyCompact(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="balance" radius={[8, 8, 0, 0]}>
                      {balanceByGrade.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--destructive))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Admissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Admissions</CardTitle>
              <CardDescription>Latest learners enrolled in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {loading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </>
                ) : recentAdmissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 col-span-full">No recent admissions</p>
                ) : (
                  recentAdmissions.map((admission, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {admission.first_name?.[0]}{admission.last_name?.[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{admission.first_name} {admission.last_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {admission.current_grade?.name} - {admission.current_stream?.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{new Date(admission.enrollment_date).toLocaleDateString()}</span>
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

        </div>

        {/* Grade, House & Department Distribution */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Learner enrollment by grade level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {loading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </>
                ) : gradeDistribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 col-span-full">No learners enrolled yet</p>
                ) : (
                  gradeDistribution.map((grade) => (
                    <div key={grade.grade} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                      <p className="font-medium text-foreground text-sm">{grade.grade}</p>
                      <Badge variant="secondary">{grade.learners}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* House Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                House Distribution
              </CardTitle>
              <CardDescription>Learners distributed across houses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : houseDistribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No learners assigned to houses</p>
                ) : (
                  houseDistribution.map((house) => (
                    <div key={house.name} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        {house.color && (
                          <div 
                            className="h-4 w-4 rounded-full" 
                            style={{ backgroundColor: house.color }}
                          />
                        )}
                        <p className="font-medium text-foreground">{house.name}</p>
                      </div>
                      <Badge variant="secondary">{house.learners} learners</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Department Distribution
              </CardTitle>
              <CardDescription>Teachers distributed across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : departmentDistribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No teachers assigned to departments</p>
                ) : (
                  departmentDistribution.map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-foreground">{dept.name}</p>
                      <Badge variant="outline">{dept.teachers} teachers</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - Mobile only, shown after distributions */}
        <div className="grid lg:hidden gap-4 grid-cols-2">
          {statsDisplay.map((stat, index) => (
            <div 
              key={`mobile-${stat.title}`} 
              className={cn(
                // First two cards (Total Learners, Active Streams) span full width on mobile
                index < 2 && "col-span-2",
                // Fee Collection and Uncollected Balance (index 2 and 3) stay side by side
                (index === 2 || index === 3) && "col-span-1",
                // Pending Admissions spans full width on mobile
                index === 4 && "col-span-2"
              )}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Recent Payments - Desktop only (mobile version above) */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest fee transactions recorded in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </>
              ) : recentPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 col-span-full">No recent payments</p>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm flex items-center gap-1 truncate">
                          {payment.learner?.first_name} {payment.learner?.last_name}
                          <Badge 
                            variant={
                              payment.status === 'paid' ? 'default' :
                              payment.status === 'partial' ? 'secondary' :
                              payment.status === 'overdue' ? 'destructive' : 'outline'
                            }
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              payment.status === 'paid' && "bg-primary text-primary-foreground",
                              payment.status === 'partial' && "bg-warning text-warning-foreground"
                            )}
                          >
                            {payment.status || 'pending'}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {payment.payment_method || 'N/A'} {payment.receipt_number ? `• ${payment.receipt_number}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-primary text-sm">{formatCurrencyCompact(payment.amount_paid)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link to="/admissions">
                <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4 w-full">
                  <UserCheck className="h-5 w-5" />
                  <span className="font-semibold">New Admission</span>
                  <span className="text-xs text-muted-foreground">Register a new learner</span>
                </Button>
              </Link>
              <Link to="/fees">
                <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4 w-full">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold">Process Payment</span>
                  <span className="text-xs text-muted-foreground">Record fee payment</span>
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
