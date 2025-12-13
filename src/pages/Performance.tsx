import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, User, Users, TrendingUp, ClipboardList } from "lucide-react";
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
  const assignedTeachersCount = learningAreas.filter(a => a.teacher_id).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Performance Tracking</h1>
            <p className="text-sm text-muted-foreground">Record and manage learner performance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setIsAnalyticsOpen(true)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setIsManageLearningAreasOpen(true)}>
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Learning Areas
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsBulkEntryOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Bulk Entry
            </Button>
            <Button size="sm" onClick={() => setIsAddPerformanceOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Learning Areas</p>
                  <p className="text-2xl font-bold">{loading ? "..." : learningAreas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assessments</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center">
                  <User className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Teachers</p>
                  <p className="text-2xl font-bold">{loading ? "..." : assignedTeachersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Areas Grid */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Learning Areas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : learningAreas.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">No learning areas found</p>
                {isAdmin && (
                  <Button size="sm" onClick={() => setIsManageLearningAreasOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Learning Area
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {learningAreas.map((area) => (
                  <div 
                    key={area.id} 
                    className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-foreground">{area.name}</h4>
                        <Badge variant="secondary" className="text-xs shrink-0">{area.code}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {area.teacher 
                          ? `${area.teacher.first_name} ${area.teacher.last_name}`
                          : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Records */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Recent Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">No performance records yet</p>
              <Button size="sm" onClick={() => setIsAddPerformanceOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Assessment
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
