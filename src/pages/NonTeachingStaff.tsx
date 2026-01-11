import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Users, Building2, CheckCircle, XCircle, Wallet, Briefcase } from "lucide-react";
import { useNonTeachingStaff } from "@/hooks/useNonTeachingStaff";
import { AddNonTeachingStaffDialog } from "@/components/AddNonTeachingStaffDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const avatarColors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
  "bg-orange-500", "bg-cyan-500"
];

const getAvatarColor = (name: string) => {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export default function NonTeachingStaff() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { staff, loading } = useNonTeachingStaff();

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && member.status === "active";
    if (statusFilter === "inactive") return matchesSearch && member.status !== "active";
    return matchesSearch;
  });

  const departments = new Set(staff.map(s => s.department).filter(Boolean)).size;
  const totalSalaries = staff.reduce((sum, s) => sum + (s.salary || 0), 0);

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === "active").length,
    inactive: staff.filter(s => s.status !== "active").length,
    departments: departments,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-primary" />
              Non-Teaching Staff
            </h1>
            <p className="text-muted-foreground">Manage support staff members</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        </div>

        {/* Staff Table with inline stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Staff List</CardTitle>
                <CardDescription>
                  {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              
              {/* Inline Stats as Filters */}
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "all" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-base font-semibold">{loading ? "..." : stats.total}</span>
                  <span className="text-sm text-muted-foreground">Total</span>
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "hover:bg-muted"
                  )}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-base font-semibold">{loading ? "..." : stats.active}</span>
                  <span className="text-sm text-muted-foreground">Active</span>
                </button>
                <button
                  onClick={() => setStatusFilter("inactive")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "inactive" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "hover:bg-muted"
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="text-base font-semibold">{loading ? "..." : stats.inactive}</span>
                  <span className="text-sm text-muted-foreground">Inactive</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base font-semibold">{loading ? "..." : stats.departments}</span>
                  <span className="text-sm text-muted-foreground">Departments</span>
                </div>
              </div>
            </div>
            
            {/* Search */}
            <div className="mt-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, job title, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Job Title</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Department</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right hidden md:table-cell">Salary</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading staff...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchQuery ? "No staff match your search" : "No staff members found"}
                        </p>
                        {!searchQuery && (
                          <Button size="sm" onClick={() => setShowAddDialog(true)} className="mt-2">
                            <Plus className="h-4 w-4 mr-1" />
                            Add First Staff
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.photo_url || ""} />
                            <AvatarFallback className={`${getAvatarColor(member.first_name)} text-white text-xs`}>
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.first_name} {member.last_name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{member.job_title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {member.department ? (
                          <Badge variant="secondary">{member.department}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <p className="text-sm">{member.email}</p>
                          <p className="text-xs text-muted-foreground">{member.phone || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            member.status === "active" 
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" 
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          )}
                        >
                          {member.status === "active" ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm hidden md:table-cell">
                        {member.salary ? `KSh ${member.salary.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddNonTeachingStaffDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </DashboardLayout>
  );
}
