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
import { useAuth } from "@/contexts/AuthContext";

const Performance = () => {
  const [isAddPerformanceOpen, setIsAddPerformanceOpen] = useState(false);
  const [isManageLearningAreasOpen, setIsManageLearningAreasOpen] = useState(false);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const { learningAreas, loading } = useLearningAreas();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Performance Tracking</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Record and manage learner performance</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => setIsAnalyticsOpen(true)}>
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setIsManageLearningAreasOpen(true)}>
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Areas</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsBulkEntryOpen(true)}>
              <Users className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Bulk</span>
            </Button>
            <Button size="sm" onClick={() => setIsAddPerformanceOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Single</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-2 grid-cols-3">
          <Card className="p-2 sm:p-3">
            <div className="text-xs text-muted-foreground">Learning Areas</div>
            <div className="text-lg sm:text-xl font-bold">{loading ? "..." : learningAreas.length}</div>
          </Card>
          <Card className="p-2 sm:p-3">
            <div className="text-xs text-muted-foreground">Assessments</div>
            <div className="text-lg sm:text-xl font-bold">0</div>
          </Card>
          <Card className="p-2 sm:p-3">
            <div className="text-xs text-muted-foreground">Teachers</div>
            <div className="text-lg sm:text-xl font-bold">{loading ? "..." : learningAreas.filter(a => a.teacher_id).length}</div>
          </Card>
        </div>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Learning Areas</CardTitle>
            <CardDescription className="text-xs">Subjects and assigned teachers</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : learningAreas.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-2">No learning areas found</p>
                <Button size="sm" onClick={() => setIsManageLearningAreasOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Learning Area
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {learningAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-2 border border-border rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">{area.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <User className="h-2.5 w-2.5" />
                          {area.teacher 
                            ? `${area.teacher.first_name} ${area.teacher.last_name}`
                            : 'Not assigned'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{area.code}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Recent Records</CardTitle>
            <CardDescription className="text-xs">Latest assessment entries</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-2">No performance records yet</p>
              <Button size="sm" onClick={() => setIsAddPerformanceOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Record First
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
