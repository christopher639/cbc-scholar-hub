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

  // Transform grades data with real learner and stream counts
  const gradesData = grades.map((grade: any) => {
    return {
      id: grade.id,
      grade: grade.name,
      totalStudents: grade.learner_count || 0,
      streamCount: grade.stream_count || 0,
    };
  });

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
            <Link key={gradeData.id} to={`/grades/${gradeData.id}`}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {gradeData.grade}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {gradeData.totalStudents} learners • {gradeData.streamCount} streams
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    <Users className="mr-1 h-4 w-4" />
                    {gradeData.totalStudents}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Button variant="outline" className="w-full">
                  View Streams & Learners
                </Button>
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
