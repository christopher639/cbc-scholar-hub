import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { AddGradeStreamDialog } from "@/components/AddGradeStreamDialog";
import { useGrades } from "@/hooks/useGrades";
import { Skeleton } from "@/components/ui/skeleton";

const Grades = () => {
  const [addStreamDialogOpen, setAddStreamDialogOpen] = useState(false);
  const { grades, loading, fetchGrades } = useGrades();

  const handleDialogClose = (open: boolean) => {
    setAddStreamDialogOpen(open);
    if (!open) {
      fetchGrades();
    }
  };

  // Transform grades data to match the expected format
  const gradesData = grades.map((grade) => ({
    grade: grade.name,
    totalStudents: 0, // TODO: Calculate from learners
    streams: grade.streams?.map((stream: any) => ({
      name: stream.name,
      teacher: "Not assigned", // TODO: Get from teacher assignment
      students: 0, // TODO: Calculate from learners
      capacity: stream.capacity || 0,
    })) || [],
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grades & Streams</h1>
            <p className="text-muted-foreground">Manage grade levels, streams, and learner distribution</p>
          </div>
          <Button className="gap-2" onClick={() => setAddStreamDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Stream
          </Button>
        </div>

        {/* Grade Cards */}
        <div className="grid gap-6">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading grades...</p>
              </CardContent>
            </Card>
          ) : gradesData.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No grades found. Click "Add New Stream" to create your first grade and stream.</p>
              </CardContent>
            </Card>
          ) : (
            gradesData.map((gradeData) => (
            <Link key={gradeData.grade} to={`/grades/${gradeData.grade.replace('Grade ', '')}`}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {gradeData.grade}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {gradeData.totalStudents} learners • {gradeData.streams.length} streams
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    <Users className="mr-1 h-4 w-4" />
                    {gradeData.totalStudents}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gradeData.streams.map((stream) => {
                    const fillPercentage = (stream.students / stream.capacity) * 100;
                    const isNearCapacity = fillPercentage >= 90;

                    return (
                      <div
                        key={stream.name}
                        className="rounded-lg border border-border bg-muted/50 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{stream.name} Stream</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">{stream.teacher}</p>
                          </div>
                          {isNearCapacity && (
                            <Badge variant="outline" className="border-warning text-warning">
                              Near Full
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Enrollment</span>
                            <span className="font-semibold text-foreground">
                              {stream.students}/{stream.capacity}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isNearCapacity ? "bg-warning" : "bg-primary"
                              }`}
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                          View Learners
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>
            </Link>
          ))
          )}
        </div>

        <AddGradeStreamDialog 
          open={addStreamDialogOpen} 
          onOpenChange={handleDialogClose}
        />
      </div>
    </DashboardLayout>
  );
};

export default Grades;
