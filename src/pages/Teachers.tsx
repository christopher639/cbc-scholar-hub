import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

  // Calculate stats
  const thisMonth = teachers.filter(t => {
    if (!t.hired_date) return false;
    const hireDate = new Date(t.hired_date);
    const now = new Date();
    return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
  }).length;

  const withAssignments = teachers.filter(t => t.specialization).length;

  // Mobile card component
  const TeacherCard = ({ teacher }: { teacher: any }) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={teacher.photo_url || ""} alt={`${teacher.first_name} ${teacher.last_name}`} />
          <AvatarFallback className={`${getAvatarColor(teacher.first_name)} text-white`}>
            {getInitials(teacher.first_name, teacher.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">{teacher.first_name} {teacher.last_name}</h3>
              <p className="text-sm text-muted-foreground">{teacher.employee_number || 'N/A'}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate(`/teachers/${teacher.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground">{teacher.email}</p>
            <p className="text-sm text-muted-foreground">{teacher.phone || 'No phone'}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {teacher.specialization && (
              <Badge variant="outline">{teacher.specialization}</Badge>
            )}
            {teacher.hired_date && (
              <Badge variant="secondary">
                Hired: {new Date(teacher.hired_date).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Teachers</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and view all teaching staff members
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Teachers</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">With Subjects</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : withAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Directory */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Teacher Directory</CardTitle>
            <CardDescription>Search and manage all teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search & Filter */}
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, employee no..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No teachers match your search" : "No teachers found"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Teacher
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 md:hidden">
                  {filteredTeachers.map((teacher) => (
                    <TeacherCard key={teacher.id} teacher={teacher} />
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Photo</TableHead>
                        <TableHead>Employee No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="hidden lg:table-cell">Specialization</TableHead>
                        <TableHead className="hidden xl:table-cell">Hired Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell>
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={teacher.photo_url || ""} alt={`${teacher.first_name} ${teacher.last_name}`} />
                              <AvatarFallback className={`${getAvatarColor(teacher.first_name)} text-white text-sm`}>
                                {getInitials(teacher.first_name, teacher.last_name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{teacher.employee_number || 'N/A'}</TableCell>
                          <TableCell>{teacher.first_name} {teacher.last_name}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="text-sm">{teacher.phone || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{teacher.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {teacher.specialization ? (
                              <Badge variant="outline">{teacher.specialization}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {teacher.hired_date 
                              ? new Date(teacher.hired_date).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigate(`/teachers/${teacher.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
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
              </>
            )}
          </CardContent>
        </Card>

        <AddTeacherDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    </DashboardLayout>
  );
};

export default Teachers;