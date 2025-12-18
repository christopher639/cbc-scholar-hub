import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddTeacherDialog } from "@/components/AddTeacherDialog";
import { Plus, Search, MoreHorizontal, Eye, Users, GraduationCap, CalendarDays, Filter } from "lucide-react";
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
  const { teachers, loading } = useTeachers();

  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.employee_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const thisMonth = teachers.filter(t => {
    if (!t.hired_date) return false;
    const hireDate = new Date(t.hired_date);
    const now = new Date();
    return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
  }).length;

  const withAssignments = teachers.filter(t => t.specialization).length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Compact Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Teachers</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage teaching staff</p>
            </div>
            
            {/* Inline Stats for Large Screens */}
            <div className="hidden lg:flex items-center gap-4 ml-4 pl-4 border-l">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold">{loading ? "..." : teachers.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded">
                  <GraduationCap className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">With Subjects</p>
                  <p className="text-sm font-semibold">{loading ? "..." : withAssignments}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-sm font-semibold">{loading ? "..." : thisMonth}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Add Teacher
            </Button>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{loading ? "..." : teachers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Subjects</p>
                <p className="text-lg font-bold">{loading ? "..." : withAssignments}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">New</p>
                <p className="text-lg font-bold">{loading ? "..." : thisMonth}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Teachers Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  {searchQuery ? "No teachers match your search" : "No teachers found"}
                </p>
                {!searchQuery && (
                  <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Teacher
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10 py-2"></TableHead>
                      <TableHead className="py-2 text-xs font-medium">Emp. No.</TableHead>
                      <TableHead className="py-2 text-xs font-medium">Name</TableHead>
                      <TableHead className="py-2 text-xs font-medium hidden md:table-cell">Contact</TableHead>
                      <TableHead className="py-2 text-xs font-medium hidden lg:table-cell">Specialization</TableHead>
                      <TableHead className="py-2 text-xs font-medium hidden xl:table-cell">Hired</TableHead>
                      <TableHead className="py-2 text-xs font-medium">Status</TableHead>
                      <TableHead className="py-2 text-xs font-medium w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/teachers/${teacher.id}`)}>
                        <TableCell className="py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={teacher.photo_url || ""} />
                            <AvatarFallback className={`${getAvatarColor(teacher.first_name)} text-white text-xs`}>
                              {getInitials(teacher.first_name, teacher.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="py-2 text-sm font-mono">{teacher.employee_number || 'N/A'}</TableCell>
                        <TableCell className="py-2">
                          <div>
                            <p className="text-sm font-medium">{teacher.first_name} {teacher.last_name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{teacher.phone || teacher.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell">
                          <div className="text-xs">
                            <p>{teacher.phone || 'N/A'}</p>
                            <p className="text-muted-foreground truncate max-w-[180px]">{teacher.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell">
                          {teacher.specialization ? (
                            <Badge variant="outline" className="text-xs">{teacher.specialization}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-sm hidden xl:table-cell">
                          {teacher.hired_date ? new Date(teacher.hired_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant={teacher.status === "active" ? "default" : "secondary"} className="text-xs">
                            {teacher.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/teachers/${teacher.id}`)}>
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View Profile
                              </DropdownMenuItem>
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

        <AddTeacherDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    </DashboardLayout>
  );
};

export default Teachers;