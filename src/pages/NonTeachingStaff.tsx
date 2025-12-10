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

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-3">
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Staff</CardDescription>
              <CardTitle className="text-xl sm:text-3xl">{loading ? "..." : staff.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">{activeStaff} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Departments</CardDescription>
              <CardTitle className="text-xl sm:text-3xl">{loading ? "..." : departments}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Active depts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Salaries</CardDescription>
              <CardTitle className="text-lg sm:text-3xl">{loading ? "..." : `${(totalSalaries / 1000).toFixed(0)}K`}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Monthly</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Directory */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl">Staff Directory</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Search and manage staff members</CardDescription>
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
