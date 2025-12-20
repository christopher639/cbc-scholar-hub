import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, Calendar, Users, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceReportDialog } from "@/components/PerformanceReportDialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentReport {
  id: string;
  academic_year: string;
  term: string;
  exam_type: string;
  grade_id: string | null;
  stream_id: string | null;
  released_at: string;
  grade_name?: string;
  stream_name?: string;
  learner_count?: number;
}

const BulkLearnerReports = () => {
  const [performanceReportOpen, setPerformanceReportOpen] = useState(false);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    setLoading(true);
    try {
      // Fetch recently released performance reports
      const { data: releases, error } = await supabase
        .from("performance_releases")
        .select(`
          *,
          grade:grades(name),
          stream:streams(name)
        `)
        .order("released_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get learner counts for each release
      const reportsWithCounts = await Promise.all(
        (releases || []).map(async (release) => {
          let query = supabase
            .from("performance_records")
            .select("learner_id", { count: "exact", head: true })
            .eq("academic_year", release.academic_year)
            .eq("term", release.term as "term_1" | "term_2" | "term_3")
            .eq("exam_type", release.exam_type);

          if (release.grade_id) {
            query = query.eq("grade_id", release.grade_id);
          }
          if (release.stream_id) {
            query = query.eq("stream_id", release.stream_id);
          }

          const { count } = await query;

          return {
            ...release,
            grade_name: release.grade?.name,
            stream_name: release.stream?.name,
            learner_count: count || 0,
          };
        })
      );

      setRecentReports(reportsWithCounts);
    } catch (error) {
      console.error("Error fetching recent reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTerm = (term: string) => {
    return term.replace("term_", "Term ");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Learner Reports</h1>
            <p className="text-muted-foreground">Generate and view performance reports</p>
          </div>
          <Button onClick={() => setPerformanceReportOpen(true)} className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Performance Report
          </Button>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Released Reports</CardTitle>
            <CardDescription>
              View and download recently generated performance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Reports Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Click the "Performance Report" button to generate your first report.
                </p>
                <Button onClick={() => setPerformanceReportOpen(true)} variant="outline">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {report.exam_type}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {report.academic_year}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatTerm(report.term)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.grade_name || "All Grades"}
                          {report.stream_name && ` - ${report.stream_name}`}
                          {" • "}
                          {report.learner_count} learner{report.learner_count !== 1 ? "s" : ""}
                          {" • "}
                          Released {format(new Date(report.released_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPerformanceReportOpen(true)}
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Report Dialog */}
        <PerformanceReportDialog
          open={performanceReportOpen}
          onOpenChange={setPerformanceReportOpen}
        />
      </div>
    </DashboardLayout>
  );
};

export default BulkLearnerReports;
