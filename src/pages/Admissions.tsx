import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText, Upload, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLearners } from "@/hooks/useLearners";
import { Skeleton } from "@/components/ui/skeleton";
import { AddLearnerDialog } from "@/components/AddLearnerDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Admissions = () => {
  const [isAddLearnerOpen, setIsAddLearnerOpen] = useState(false);
  const { learners, loading, fetchLearners } = useLearners();

  // Get recent admissions (last 10)
  const recentAdmissions = learners
    .sort((a, b) => new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime())
    .slice(0, 10);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">Learner Admissions</h1>
            <p className="text-xs sm:text-base text-muted-foreground">Manage new learner registrations</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" size="sm" onClick={() => setIsAddLearnerOpen(true)}>
            <UserPlus className="h-4 w-4" />
            New Admission
          </Button>
        </div>

        {/* Admission Process */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl">Admission Process</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Follow these steps to admit a new learner</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-base">1. Basic Info</h3>
                <p className="text-xs text-muted-foreground hidden sm:block">Enter learner and parent details</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-base">2. Documents</h3>
                <p className="text-xs text-muted-foreground hidden sm:block">Upload birth certificate & photo</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-base">3. Assignment</h3>
                <p className="text-xs text-muted-foreground hidden sm:block">Assign grade and stream</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-base">4. Complete</h3>
                <p className="text-xs text-muted-foreground hidden sm:block">Generate admission number</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Admissions Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl">Recent Admissions</CardTitle>
            <CardDescription>Latest learner registrations</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentAdmissions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">No recent admissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Learner Name</TableHead>
                      <TableHead className="min-w-[120px]">Adm. No.</TableHead>
                      <TableHead className="min-w-[120px]">Grade</TableHead>
                      <TableHead className="min-w-[100px]">Stream</TableHead>
                      <TableHead className="min-w-[100px]">Gender</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAdmissions.map((admission: any) => (
                      <TableRow key={admission.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-primary">
                                {admission.first_name?.[0]}{admission.last_name?.[0]}
                              </span>
                            </div>
                            <span>{admission.first_name} {admission.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{admission.admission_number}</TableCell>
                        <TableCell>{admission.current_grade?.name || "-"}</TableCell>
                        <TableCell>{admission.current_stream?.name || "-"}</TableCell>
                        <TableCell className="capitalize">{admission.gender}</TableCell>
                        <TableCell>{new Date(admission.enrollment_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="text-xs">Completed</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
