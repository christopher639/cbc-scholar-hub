import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText, Upload, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLearners } from "@/hooks/useLearners";
import { Skeleton } from "@/components/ui/skeleton";
import { AddLearnerDialog } from "@/components/AddLearnerDialog";

const Admissions = () => {
  const [isAddLearnerOpen, setIsAddLearnerOpen] = useState(false);
  const { learners, loading, fetchLearners } = useLearners();

  // Get recent admissions (last 10)
  const recentAdmissions = learners
    .sort((a, b) => new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime())
    .slice(0, 10);

  // Calculate stats
  const thisMonth = learners.filter(l => {
    const enrollDate = new Date(l.enrollment_date);
    const now = new Date();
    return enrollDate.getMonth() === now.getMonth() && enrollDate.getFullYear() === now.getFullYear();
  }).length;

  const thisYear = learners.filter(l => {
    const enrollDate = new Date(l.enrollment_date);
    const now = new Date();
    return enrollDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Learner Admissions</h1>
            <p className="text-muted-foreground">Manage new learner registrations and admissions</p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddLearnerOpen(true)}>
            <UserPlus className="h-4 w-4" />
            New Admission
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{loading ? "..." : thisMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">New admissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Awaiting documentation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Year</CardDescription>
              <CardTitle className="text-3xl">{loading ? "..." : thisYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total admissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Admission Process */}
        <Card>
          <CardHeader>
            <CardTitle>Admission Process</CardTitle>
            <CardDescription>Follow these steps to admit a new learner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">1. Basic Information</h3>
                <p className="text-sm text-muted-foreground">Enter learner and parent details</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">2. Documents</h3>
                <p className="text-sm text-muted-foreground">Upload birth certificate & photo</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">3. Assignment</h3>
                <p className="text-sm text-muted-foreground">Assign grade and stream</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">4. Complete</h3>
                <p className="text-sm text-muted-foreground">Generate admission number</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Admissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admissions</CardTitle>
            <CardDescription>Latest learner registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentAdmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent admissions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAdmissions.map((admission: any) => (
                  <div
                    key={admission.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {admission.first_name?.[0]}{admission.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {admission.first_name} {admission.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {admission.admission_number} • {admission.current_grade?.name} {admission.current_stream?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(admission.enrollment_date).toLocaleDateString()}
                      </p>
                      <Badge>Completed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddLearnerDialog 
        open={isAddLearnerOpen} 
        onOpenChange={setIsAddLearnerOpen}
      />
    </DashboardLayout>
  );
};

export default Admissions;
