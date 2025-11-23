import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, User, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import AddPerformanceDialog from "@/components/AddPerformanceDialog";
import { ManageLearningAreasDialog } from "@/components/ManageLearningAreasDialog";
import { BulkPerformanceEntry } from "@/components/BulkPerformanceEntry";
import { PerformanceAnalyticsDialog } from "@/components/PerformanceAnalyticsDialog";
import { Badge } from "@/components/ui/badge";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { Skeleton } from "@/components/ui/skeleton";

const Performance = () => {
  const [isAddPerformanceOpen, setIsAddPerformanceOpen] = useState(false);
  const [isManageLearningAreasOpen, setIsManageLearningAreasOpen] = useState(false);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const { learningAreas, loading } = useLearningAreas();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Performance Tracking</h1>
            <p className="text-muted-foreground">Record and manage learner performance across learning areas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setIsAnalyticsOpen(true)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Analytics
            </Button>
            <Button variant="outline" onClick={() => setIsManageLearningAreasOpen(true)}>
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Learning Areas
            </Button>
            <Button variant="outline" onClick={() => setIsBulkEntryOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Bulk Entry by Stream
            </Button>
            <Button onClick={() => setIsAddPerformanceOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Single Entry
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Learning Areas</CardDescription>
              <CardTitle className="text-3xl">{loading ? "..." : learningAreas.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Active subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Assessments</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Recorded this term</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Teachers Assigned</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? "..." : learningAreas.filter(a => a.teacher_id).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">With learning area assignments</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Learning Areas</CardTitle>
            <CardDescription>Subjects and assigned teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : learningAreas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No learning areas found</p>
                <Button onClick={() => setIsManageLearningAreasOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Learning Area
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {learningAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{area.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {area.teacher 
                            ? `${area.teacher.first_name} ${area.teacher.last_name}`
                            : 'No teacher assigned'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Code: {area.code}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance Records</CardTitle>
            <CardDescription>Latest assessment entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No performance records yet</p>
              <Button onClick={() => setIsAddPerformanceOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Performance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddPerformanceDialog open={isAddPerformanceOpen} onOpenChange={setIsAddPerformanceOpen} />
      <ManageLearningAreasDialog open={isManageLearningAreasOpen} onOpenChange={setIsManageLearningAreasOpen} />
      <BulkPerformanceEntry open={isBulkEntryOpen} onOpenChange={setIsBulkEntryOpen} />
      <PerformanceAnalyticsDialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen} />
    </DashboardLayout>
  );
};

export default Performance;
