import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { useNonTeachingStaff } from "@/hooks/useNonTeachingStaff";
import { AddNonTeachingStaffDialog } from "@/components/AddNonTeachingStaffDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function NonTeachingStaff() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { staff, loading } = useNonTeachingStaff();

  const filteredStaff = staff.filter((member) =>
    member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStaff = staff.filter(s => s.status === 'active').length;
  const departments = new Set(staff.map(s => s.department).filter(Boolean)).size;
  const totalSalaries = staff.reduce((sum, s) => sum + (s.salary || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:block">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">Non-Teaching Staff</h1>
              <p className="text-xs sm:text-base text-muted-foreground">Manage support staff</p>
            </div>
            <Button className="gap-2 sm:hidden" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <Button className="gap-2 hidden sm:flex" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>

        {/* Staff Directory */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg sm:text-2xl">Staff Directory</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Search and manage staff members</CardDescription>
              </div>
              {/* Stats - inline on large screens */}
              <div className="flex justify-between gap-2 lg:gap-3">
                <Card className="w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center p-2 border-dashed">
                  <p className="text-[10px] text-muted-foreground">Total Staff</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : staff.length}</p>
                  <p className="text-[9px] text-muted-foreground">{activeStaff} active</p>
                </Card>
                <Card className="w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center p-2 border-dashed">
                  <p className="text-[10px] text-muted-foreground">Departments</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : departments}</p>
                  <p className="text-[9px] text-muted-foreground">Active depts</p>
                </Card>
                <Card className="w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center p-2 border-dashed">
                  <p className="text-[10px] text-muted-foreground">Salaries</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : `${(totalSalaries / 1000).toFixed(0)}K`}</p>
                  <p className="text-[9px] text-muted-foreground">Monthly</p>
                </Card>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email..."
                  className="pl-10 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Staff Table */}
            <div className="rounded-md border overflow-x-auto">
              {loading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No staff members found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Job Title</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Department</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Contact</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{member.job_title}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{member.department || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs sm:text-sm">
                            <div>{member.email}</div>
                            <div className="text-muted-foreground">{member.phone || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm hidden lg:table-cell">
                          {member.salary ? `KSh ${member.salary.toLocaleString()}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddNonTeachingStaffDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </DashboardLayout>
  );
}
