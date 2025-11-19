import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { AddGradeStreamDialog } from "@/components/AddGradeStreamDialog";
import { EditGradeDialog } from "@/components/EditGradeDialog";
import { useGrades } from "@/hooks/useGrades";
import { Skeleton } from "@/components/ui/skeleton";

const Grades = () => {
  const [addStreamDialogOpen, setAddStreamDialogOpen] = useState(false);
  const [editGradeDialogOpen, setEditGradeDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
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
            gradesData.map((gradeData) => {
              const fullGrade = grades.find((g: any) => g.id === gradeData.id);
              return (
                <Card key={gradeData.id} className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          {gradeData.grade}
                          {fullGrade?.is_last_grade && (
                            <Badge variant="outline" className="ml-2">Final Grade</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {gradeData.totalStudents} learners • {gradeData.streamCount} streams
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-base">
                          <Users className="mr-1 h-4 w-4" />
                          {gradeData.totalStudents}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedGrade(fullGrade);
                            setEditGradeDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Link to={`/grades/${gradeData.id}`}>
                      <Button variant="outline" className="w-full">
                        View Streams & Learners
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <AddGradeStreamDialog 
          open={addStreamDialogOpen} 
          onOpenChange={handleDialogClose}
        />

        {selectedGrade && (
          <EditGradeDialog
            open={editGradeDialogOpen}
            onOpenChange={setEditGradeDialogOpen}
            grade={selectedGrade}
            onSuccess={fetchGrades}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Grades;
