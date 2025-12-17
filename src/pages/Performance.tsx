import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, User, Users, FileText, ClipboardList, Search, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import AddPerformanceDialog from "@/components/AddPerformanceDialog";
import { ManageLearningAreasDialog } from "@/components/ManageLearningAreasDialog";
import { BulkPerformanceEntry } from "@/components/BulkPerformanceEntry";
import { PerformanceReportDialog } from "@/components/PerformanceReportDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Performance = () => {
  const [isAddPerformanceOpen, setIsAddPerformanceOpen] = useState(false);
  const [isManageLearningAreasOpen, setIsManageLearningAreasOpen] = useState(false);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { learningAreas, loading } = useLearningAreas();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const assignedTeachersCount = learningAreas.filter(a => a.teacher_id).length;

  const filteredAreas = learningAreas.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Performance</h1>
              <p className="text-sm text-muted-foreground">Record and manage learner performance</p>
            </div>
            
            {/* Inline Stats for Large Screens */}
            <div className="hidden lg:flex items-center gap-4 ml-4 pl-4 border-l">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Learning Areas</p>
                  <p className="text-sm font-semibold">{loading ? "..." : learningAreas.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded">
                  <User className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Teachers</p>
                  <p className="text-sm font-semibold">{loading ? "..." : assignedTeachersCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded">
                  <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assessments</p>
                  <p className="text-sm font-semibold">0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <Button variant="outline" size="sm" className="h-9" onClick={() => setIsReportOpen(true)}>
                <FileText className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Performance Report</span>
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" className="h-9" onClick={() => setIsManageLearningAreasOpen(true)}>
                <BookOpen className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Learning Areas</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-9" onClick={() => setIsBulkEntryOpen(true)}>
              <Users className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Bulk Entry</span>
            </Button>
            <Button size="sm" className="h-9" onClick={() => setIsAddPerformanceOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Add Record</span>
            </Button>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <BookOpen className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Areas</p>
              <p className="text-sm font-semibold">{loading ? "..." : learningAreas.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <User className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Assigned</p>
              <p className="text-sm font-semibold">{loading ? "..." : assignedTeachersCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Exams</p>
              <p className="text-sm font-semibold">0</p>
            </div>
          </div>
        </div>

        {/* Learning Areas Table */}
        <Card>
          <div className="px-4 pt-4 pb-2 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-sm font-medium text-foreground">Learning Areas</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search areas..."
                className="pl-8 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No learning areas found</p>
                {isAdmin && (
                  <Button size="sm" onClick={() => setIsManageLearningAreasOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Learning Area
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2 text-xs">Code</TableHead>
                      <TableHead className="py-2 text-xs">Name</TableHead>
                      <TableHead className="py-2 text-xs hidden md:table-cell">Description</TableHead>
                      <TableHead className="py-2 text-xs">Assigned Teacher</TableHead>
                      <TableHead className="w-12 py-2 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.map((area) => (
                      <TableRow key={area.id} className="h-12">
                        <TableCell className="py-1.5">
                          <Badge variant="secondary" className="text-xs font-mono">{area.code}</Badge>
                        </TableCell>
                        <TableCell className="py-1.5 text-sm font-medium">{area.name}</TableCell>
                        <TableCell className="py-1.5 text-sm text-muted-foreground hidden md:table-cell">
                          {area.description || "—"}
                        </TableCell>
                        <TableCell className="py-1.5">
                          {area.teacher ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-sm">{area.teacher.first_name} {area.teacher.last_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setIsBulkEntryOpen(true)}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Record Marks
                              </DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem onClick={() => setIsManageLearningAreasOpen(true)}>
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Edit Area
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="px-4 pt-4 pb-2 border-b">
            <h2 className="text-sm font-medium text-foreground">Quick Actions</h2>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 justify-center"
                onClick={() => setIsAddPerformanceOpen(true)}
              >
                <Plus className="h-5 w-5 text-primary" />
                <span className="text-sm">Add Single Record</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 justify-center"
                onClick={() => setIsBulkEntryOpen(true)}
              >
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Bulk Entry</span>
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 justify-center"
                  onClick={() => setIsReportOpen(true)}
                >
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Performance Report</span>
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 justify-center"
                  onClick={() => setIsManageLearningAreasOpen(true)}
                >
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  <span className="text-sm">Manage Areas</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Stats Summary */}
        <div className="flex items-center justify-center gap-8 py-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Learning Areas</p>
            <p className="text-lg font-semibold text-foreground">{loading ? "..." : learningAreas.length}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Assigned</p>
            <p className="text-lg font-semibold text-foreground">{loading ? "..." : assignedTeachersCount}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Exams</p>
            <p className="text-lg font-semibold text-foreground">0</p>
          </div>
        </div>
      </div>

      <AddPerformanceDialog open={isAddPerformanceOpen} onOpenChange={setIsAddPerformanceOpen} />
      <ManageLearningAreasDialog open={isManageLearningAreasOpen} onOpenChange={setIsManageLearningAreasOpen} />
      <BulkPerformanceEntry open={isBulkEntryOpen} onOpenChange={setIsBulkEntryOpen} />
      <PerformanceReportDialog open={isReportOpen} onOpenChange={setIsReportOpen} />
    </DashboardLayout>
  );
};

export default Performance;