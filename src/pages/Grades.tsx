import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen } from "lucide-react";

const Grades = () => {
  const grades = [
    {
      grade: "Grade 1",
      totalStudents: 215,
      streams: [
        { name: "Red", students: 72, capacity: 75, teacher: "Mrs. Njeri" },
        { name: "Blue", students: 71, capacity: 75, teacher: "Mr. Kamau" },
        { name: "Green", students: 72, capacity: 75, teacher: "Mrs. Akinyi" },
      ],
    },
    {
      grade: "Grade 2",
      totalStudents: 208,
      streams: [
        { name: "Red", students: 69, capacity: 75, teacher: "Mr. Omondi" },
        { name: "Blue", students: 70, capacity: 75, teacher: "Mrs. Wanjiku" },
        { name: "Yellow", students: 69, capacity: 75, teacher: "Ms. Chebet" },
      ],
    },
    {
      grade: "Grade 3",
      totalStudents: 198,
      streams: [
        { name: "Red", students: 66, capacity: 75, teacher: "Mr. Kipchoge" },
        { name: "Blue", students: 65, capacity: 75, teacher: "Mrs. Njoki" },
        { name: "Green", students: 67, capacity: 75, teacher: "Mr. Otieno" },
      ],
    },
    {
      grade: "Grade 4",
      totalStudents: 195,
      streams: [
        { name: "Green", students: 65, capacity: 75, teacher: "Mrs. Mutua" },
        { name: "Red", students: 65, capacity: 75, teacher: "Mr. Kimani" },
        { name: "Yellow", students: 65, capacity: 75, teacher: "Ms. Auma" },
      ],
    },
    {
      grade: "Grade 5",
      totalStudents: 218,
      streams: [
        { name: "Green", students: 73, capacity: 75, teacher: "Mr. Kariuki" },
        { name: "Red", students: 72, capacity: 75, teacher: "Mrs. Adhiambo" },
        { name: "Blue", students: 73, capacity: 75, teacher: "Mr. Rotich" },
      ],
    },
    {
      grade: "Grade 6",
      totalStudents: 213,
      streams: [
        { name: "Red", students: 71, capacity: 75, teacher: "Mrs. Mwangi" },
        { name: "Blue", students: 71, capacity: 75, teacher: "Mr. Njoroge" },
        { name: "Green", students: 71, capacity: 75, teacher: "Ms. Wambui" },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grades & Streams</h1>
            <p className="text-muted-foreground">Manage grade levels and class streams</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Stream
          </Button>
        </div>

        {/* Grade Cards */}
        <div className="grid gap-6">
          {grades.map((gradeData) => (
            <Card key={gradeData.grade}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {gradeData.grade}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {gradeData.totalStudents} students • {gradeData.streams.length} streams
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
                          View Students
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Grades;
