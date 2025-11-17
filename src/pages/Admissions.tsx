import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, UserPlus, FileText, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Admissions = () => {
  const recentAdmissions = [
    {
      admissionNo: "ADM007",
      name: "James Muthoni Kamau",
      grade: "Grade 1",
      stream: "Green",
      dateAdmitted: "2025-01-15",
      status: "Completed",
    },
    {
      admissionNo: "ADM008",
      name: "Lucy Achieng Odhiambo",
      grade: "Grade 2",
      stream: "Red",
      dateAdmitted: "2025-01-14",
      status: "Pending Documents",
    },
    {
      admissionNo: "ADM009",
      name: "Kevin Kiprop Sang",
      grade: "Grade 4",
      stream: "Blue",
      dateAdmitted: "2025-01-13",
      status: "Completed",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Learner Admissions</h1>
            <p className="text-muted-foreground">Manage new learner registrations and admissions</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Admission
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">24</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">New admissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">5</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Awaiting documentation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Year</CardDescription>
              <CardTitle className="text-3xl">187</CardTitle>
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
            <div className="space-y-4">
              {recentAdmissions.map((admission) => (
                <div
                  key={admission.admissionNo}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {admission.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{admission.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {admission.admissionNo} • {admission.grade} {admission.stream}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">{admission.dateAdmitted}</p>
                    <Badge variant={admission.status === "Completed" ? "default" : "secondary"}>
                      {admission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admissions;
