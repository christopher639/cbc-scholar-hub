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

  // Get recent admissions (last 15)
  const recentAdmissions = learners
    .sort((a, b) => new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime())
    .slice(0, 15);

  // Split into columns for multi-column layout
  const getColumns = (items: any[], numCols: number) => {
    const cols: any[][] = Array.from({ length: numCols }, () => []);
    items.forEach((item, idx) => {
      cols[idx % numCols].push({ ...item, originalIndex: idx });
    });
    return cols;
  };

  const renderTable = (items: any[]) => (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8 py-1.5 px-2 text-[11px] font-medium">#</TableHead>
            <TableHead className="py-1.5 px-2 text-[11px] font-medium">Adm No.</TableHead>
            <TableHead className="py-1.5 px-2 text-[11px] font-medium">Name</TableHead>
            <TableHead className="py-1.5 px-2 text-[11px] font-medium hidden md:table-cell">Grade</TableHead>
            <TableHead className="py-1.5 px-2 text-[11px] font-medium hidden lg:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((admission) => (
            <TableRow key={admission.id} className="hover:bg-muted/30">
              <TableCell className="py-1 px-2 text-[11px] text-muted-foreground">{admission.originalIndex + 1}</TableCell>
              <TableCell className="py-1 px-2">
                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">{admission.admission_number}</Badge>
              </TableCell>
              <TableCell className="py-1 px-2">
                <p className="text-xs font-medium leading-tight">{admission.first_name} {admission.last_name}</p>
                <p className="text-[10px] text-muted-foreground md:hidden leading-tight">
                  {admission.current_grade?.name || "-"} {admission.current_stream?.name || ""}
                </p>
              </TableCell>
              <TableCell className="py-1 px-2 hidden md:table-cell">
                <span className="text-xs">{admission.current_grade?.name || "-"} {admission.current_stream?.name || ""}</span>
              </TableCell>
              <TableCell className="py-1 px-2 hidden lg:table-cell">
                <span className="text-[11px] text-muted-foreground">{new Date(admission.enrollment_date).toLocaleDateString()}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Learner Admissions</h1>
            <p className="text-sm text-muted-foreground">Manage new learner registrations</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" size="sm" onClick={() => setIsAddLearnerOpen(true)}>
            <UserPlus className="h-4 w-4" />
            New Admission
          </Button>
        </div>

        {/* Admission Process */}
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Admission Process</CardTitle>
            <CardDescription className="text-[11px] sm:text-xs">Follow these steps to admit a new learner</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-[10px] sm:text-xs">1. Basic Info</h3>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Enter details</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-[10px] sm:text-xs">2. Documents</h3>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Upload docs</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-[10px] sm:text-xs">3. Assignment</h3>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Assign grade</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-[10px] sm:text-xs">4. Complete</h3>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Get adm no.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Admissions - Multi-column tables like Learning Areas */}
        <div>
          <h2 className="text-sm font-semibold mb-2">Recent Admissions</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-8 w-full" />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : recentAdmissions.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <UserPlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-xs mb-2">No recent admissions</p>
                  <Button size="sm" onClick={() => setIsAddLearnerOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add First Learner
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 2 columns on sm, 3 on lg */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {getColumns(recentAdmissions, 3).map((col, colIdx) => (
                  <div key={colIdx} className={colIdx === 2 ? "hidden lg:block" : ""}>
                    {col.length > 0 && renderTable(col)}
                  </div>
                ))}
              </div>
              {/* Single column on mobile */}
              <div className="sm:hidden">
                {renderTable(recentAdmissions.map((item, idx) => ({ ...item, originalIndex: idx })))}
              </div>
            </>
          )}
        </div>
      </div>

      <AddLearnerDialog 
        open={isAddLearnerOpen} 
        onOpenChange={setIsAddLearnerOpen}
      />
    </DashboardLayout>
  );
};

export default Admissions;
