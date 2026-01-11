import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddTeacherDialog } from "@/components/AddTeacherDialog";
import { Plus, Search, MoreHorizontal, Eye, Users, GraduationCap, CalendarDays, CheckCircle, XCircle, Phone, User } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
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

const Teachers = () => {
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { teachers, loading } = useTeachers();

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employee_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && teacher.status === "active";
    if (statusFilter === "inactive") return matchesSearch && teacher.status !== "active";
    if (statusFilter === "with_subjects") return matchesSearch && teacher.specialization;
    return matchesSearch;
  });

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === "active").length,
    inactive: teachers.filter(t => t.status !== "active").length,
    withSubjects: teachers.filter(t => t.specialization).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              Teachers
            </h1>
            <p className="text-muted-foreground">Manage teaching staff</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </div>

        {/* Teachers Table with inline stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Teachers List</CardTitle>
                <CardDescription>
                  {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} found
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
                <button
                  onClick={() => setStatusFilter("with_subjects")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer",
                    statusFilter === "with_subjects" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "hover:bg-muted"
                  )}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-base font-semibold">{loading ? "..." : stats.withSubjects}</span>
                  <span className="text-sm text-muted-foreground">With Subjects</span>
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="mt-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or employee number..."
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
                  <TableHead className="font-semibold">Emp. No.</TableHead>
                  <TableHead className="font-semibold">Teacher</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Contact</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Specialization</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">Hired Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading teachers...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchQuery ? "No teachers match your search" : "No teachers found"}
                        </p>
                        {!searchQuery && (
                          <Button size="sm" onClick={() => setAddDialogOpen(true)} className="mt-2">
                            <Plus className="h-4 w-4 mr-1" />
                            Add First Teacher
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow 
                      key={teacher.id} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/teachers/${teacher.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {teacher.employee_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={teacher.photo_url || ""} />
                            <AvatarFallback className={`${getAvatarColor(teacher.first_name)} text-white text-xs`}>
                              {getInitials(teacher.first_name, teacher.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{teacher.first_name} {teacher.last_name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{teacher.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-sm">{teacher.phone || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{teacher.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {teacher.specialization ? (
                          <Badge variant="secondary">{teacher.specialization}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
                        {teacher.hired_date ? new Date(teacher.hired_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            teacher.status === "active" 
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" 
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          )}
                        >
                          {teacher.status === "active" ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/teachers/${teacher.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
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

        <AddTeacherDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
