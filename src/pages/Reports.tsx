import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Users, DollarSign, GraduationCap, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

const Reports = () => {
  const { toast } = useToast();
  const { academicYears, loading: yearsLoading } = useAcademicYears();
  const [academicYear, setAcademicYear] = useState("");
  const [term, setTerm] = useState("all");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    learnerStats: {
      total: 0,
      byGender: { male: 0, female: 0, other: 0 },
      byGrade: [] as Array<{ grade: string; count: number }>,
    },
    feeStats: {
      totalCollected: 0,
      outstanding: 0,
      collectionRate: 0,
      totalBilled: 0,
    },
    admissionTrends: [] as Array<{ month: string; count: number }>,
  });

  // Set default academic year when years load
  useEffect(() => {
    if (academicYears.length > 0 && !academicYear) {
      const active = academicYears.find(y => y.is_active);
      setAcademicYear(active?.year || academicYears[0]?.year || "");
    }
  }, [academicYears]);

  // Fetch analytics when filters change
  useEffect(() => {
    if (academicYear) {
      fetchAnalytics();
    }
  }, [academicYear, term]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Learner statistics - filter by enrollment year matching academic year
      const { data: learners } = await supabase
        .from("learners")
        .select("gender, current_grade_id, enrollment_date, grades(name)")
        .eq("status", "active");

      const total = learners?.length || 0;
      const byGender = learners?.reduce(
        (acc, l) => {
          acc[l.gender] = (acc[l.gender] || 0) + 1;
          return acc;
        },
        { male: 0, female: 0, other: 0 } as any
      ) || { male: 0, female: 0, other: 0 };

      // Grade distribution
      const gradeMap = new Map<string, number>();
      learners?.forEach((l: any) => {
        const gradeName = l.grades?.name || "Unassigned";
        gradeMap.set(gradeName, (gradeMap.get(gradeName) || 0) + 1);
      });

      const byGrade = Array.from(gradeMap.entries()).map(([grade, count]) => ({
        grade,
        count,
      }));

      // Fee statistics with filters
      let invoiceQuery = supabase
        .from("student_invoices")
        .select("total_amount, amount_paid, balance_due, academic_year, term");

      if (academicYear) {
        invoiceQuery = invoiceQuery.eq("academic_year", academicYear);
      }
      if (term && term !== "all") {
        invoiceQuery = invoiceQuery.eq("term", term as "term_1" | "term_2" | "term_3");
      }

      const { data: invoices } = await invoiceQuery;

      const totalBilled = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      const totalCollected = invoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0;
      const outstanding = invoices?.reduce((sum, inv) => sum + Number(inv.balance_due), 0) || 0;
      const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

      // Admission trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const admissionMap = new Map<string, number>();
      learners
        ?.filter((l) => new Date(l.enrollment_date) >= sixMonthsAgo)
        .forEach((l) => {
          const month = new Date(l.enrollment_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          });
          admissionMap.set(month, (admissionMap.get(month) || 0) + 1);
        });

      const admissionTrends = Array.from(admissionMap.entries()).map(
        ([month, count]) => ({ month, count })
      );

      setAnalytics({
        learnerStats: { total, byGender, byGrade },
        feeStats: { totalCollected, outstanding, collectionRate, totalBilled },
        admissionTrends,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reportCategories = [
    {
      title: "Learner Reports",
      icon: Users,
      stats: loading ? "..." : `${analytics.learnerStats.total} Total`,
      reports: [
        { name: "Learner Population Report", description: "Complete breakdown by grade and stream", count: analytics.learnerStats.total },
        { name: "Learner Demographics", description: `${analytics.learnerStats.byGender.male}M / ${analytics.learnerStats.byGender.female}F`, count: analytics.learnerStats.total },
      ],
    },
    {
      title: "Fee Reports",
      icon: DollarSign,
      stats: loading ? "..." : `${analytics.feeStats.collectionRate.toFixed(0)}% Rate`,
      reports: [
        { name: "Fee Collection Summary", description: `${formatCurrency(analytics.feeStats.totalCollected)} collected`, count: 0 },
        { name: "Balance Outstanding", description: `${formatCurrency(analytics.feeStats.outstanding)} pending`, count: 0 },
      ],
    },
    {
      title: "Academic Reports",
      icon: GraduationCap,
      stats: loading ? "..." : `${analytics.learnerStats.byGrade.length} Grades`,
      reports: [
        { name: "Grade Distribution", description: "Learner count per grade", count: analytics.learnerStats.byGrade.length },
        { name: "Promotion History", description: "Learner progression tracking", count: 0 },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Generate comprehensive reports for decision making</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>

        {/* Time Period Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Analytics Filters
            </CardTitle>
            <CardDescription>Select the time range for generating reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-sm">Academic Year</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger id="academicYear">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsLoading ? (
                      <SelectItem value="__loading__" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.year}>
                          {year.year}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="term" className="text-sm">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="term_1">Term 1</SelectItem>
                    <SelectItem value="term_2">Term 2</SelectItem>
                    <SelectItem value="term_3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={fetchAnalytics} disabled={loading}>
                  {loading ? "Loading..." : "Apply Filters"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Learners
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{loading ? "..." : analytics.learnerStats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Enrolled learners</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Fee Collection
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{loading ? "..." : `${analytics.feeStats.collectionRate.toFixed(0)}%`}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Collection rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Collected
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl">{loading ? "..." : formatCurrency(analytics.feeStats.totalCollected)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">For {academicYear} {term !== "all" ? term.replace("_", " ").toUpperCase() : ""}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Outstanding
              </CardDescription>
              <CardTitle className="text-lg sm:text-2xl">{loading ? "..." : formatCurrency(analytics.feeStats.outstanding)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Pending balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Categories */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{category.title}</CardTitle>
                </div>
                <CardDescription>{category.reports.length} available reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.reports.map((report) => (
                    <div
                      key={report.name}
                      className="flex items-start justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <h4 className="font-medium text-foreground text-sm">{report.name}</h4>
                          <p className="text-xs text-muted-foreground">{report.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Report Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom Report Builder</CardTitle>
            <CardDescription>Create customized reports with specific parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground text-sm">
                Use the custom report builder to create tailored reports
                <br />
                with specific date ranges, filters, and data points
              </p>
              <Button>Launch Report Builder</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </DashboardLayout>
  );
};

export default Reports;
