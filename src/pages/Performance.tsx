import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, User, TrendingUp } from "lucide-react";
import { useState } from "react";
import { AddPerformanceDialog } from "@/components/AddPerformanceDialog";
import { ManageLearningAreasDialog } from "@/components/ManageLearningAreasDialog";
import { Badge } from "@/components/ui/badge";

const Performance = () => {
  const [isAddPerformanceOpen, setIsAddPerformanceOpen] = useState(false);
  const [isManageLearningAreasOpen, setIsManageLearningAreasOpen] = useState(false);

  const learningAreas = [
    { id: 1, name: "Mathematics", teacher: "Mr. James Mwangi", learners: 45 },
    { id: 2, name: "English", teacher: "Mrs. Grace Njeri", learners: 48 },
    { id: 3, name: "Kiswahili", teacher: "Mr. David Omondi", learners: 48 },
    { id: 4, name: "Science & Technology", teacher: "Mrs. Mary Wanjiku", learners: 45 },
    { id: 5, name: "Social Studies", teacher: "Mr. Peter Kipchoge", learners: 42 },
  ];

  const recentPerformance = [
    { learner: "John Kamau", grade: "Grade 4", area: "Mathematics", score: 85, exam: "End Term 1 2024" },
    { learner: "Mary Wanjiku", grade: "Grade 1", area: "English", score: 92, exam: "End Term 1 2024" },
    { learner: "David Omondi", grade: "Grade 3", area: "Science & Technology", score: 78, exam: "End Term 1 2024" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Performance Tracking</h1>
            <p className="text-muted-foreground">Record and manage learner performance across learning areas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsManageLearningAreasOpen(true)}>
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Learning Areas
            </Button>
            <Button onClick={() => setIsAddPerformanceOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Performance
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Learning Areas</CardDescription>
              <CardTitle className="text-3xl">{learningAreas.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Active subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">82.5%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-success flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                +5.2% from last term
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Assessments This Term</CardDescription>
              <CardTitle className="text-3xl">156</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Across all grades</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Learning Areas</CardTitle>
            <CardDescription>Subjects and assigned teachers</CardDescription>
          </CardHeader>
          <CardContent>
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
                        {area.teacher}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{area.learners} learners</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance Records</CardTitle>
            <CardDescription>Latest assessment entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Learner</th>
                    <th className="pb-3 pr-4">Grade</th>
                    <th className="pb-3 pr-4">Learning Area</th>
                    <th className="pb-3 pr-4">Exam</th>
                    <th className="pb-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentPerformance.map((record, index) => (
                    <tr key={index} className="text-sm">
                      <td className="py-4 pr-4 font-medium text-foreground">{record.learner}</td>
                      <td className="py-4 pr-4 text-foreground">{record.grade}</td>
                      <td className="py-4 pr-4 text-foreground">{record.area}</td>
                      <td className="py-4 pr-4 text-muted-foreground">{record.exam}</td>
                      <td className="py-4">
                        <Badge variant={record.score >= 80 ? "default" : record.score >= 60 ? "secondary" : "outline"}>
                          {record.score}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddPerformanceDialog open={isAddPerformanceOpen} onOpenChange={setIsAddPerformanceOpen} />
      <ManageLearningAreasDialog open={isManageLearningAreasOpen} onOpenChange={setIsManageLearningAreasOpen} />
    </DashboardLayout>
  );
};

export default Performance;
