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
import { Plus, Search, MoreHorizontal, Eye } from "lucide-react";
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

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Teacher Directory */}
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base sm:text-xl">Teacher Directory</CardTitle>
                <CardDescription className="text-xs">Search and manage teachers</CardDescription>
              </div>
              {/* Stats + Add Button */}
              <div className="flex justify-between items-center gap-2">
                <Card className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center p-1 border-dashed">
                  <p className="text-[9px] text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-xl font-bold">{loading ? "..." : teachers.length}</p>
                  <p className="text-[8px] text-muted-foreground">Teachers</p>
                </Card>
                <Card className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center p-1 border-dashed">
                  <p className="text-[9px] text-muted-foreground">Assigned</p>
                  <p className="text-lg sm:text-xl font-bold">{loading ? "..." : withAssignments}</p>
                  <p className="text-[8px] text-muted-foreground">Subjects</p>
                </Card>
                <Card className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center p-1 border-dashed">
                  <p className="text-[9px] text-muted-foreground">This Month</p>
                  <p className="text-lg sm:text-xl font-bold">{loading ? "..." : thisMonth}</p>
                  <p className="text-[8px] text-muted-foreground">New</p>
                </Card>
                <Button 
                  className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center gap-1" 
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-[9px] sm:text-xs">Add</span>
                </Button>
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
              <Button variant="outline" size="sm">Filter</Button>
            </div>

            {/* Teachers Table */}
            <div className="rounded-md border overflow-x-auto">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4 text-sm">
                    {searchQuery ? "No teachers match your search" : "No teachers found"}
                  </p>
                  {!searchQuery && (
                    <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Teacher
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm w-12">Photo</TableHead>
                      <TableHead className="text-xs sm:text-sm">Employee No.</TableHead>
                      <TableHead className="text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Contact</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Specialization</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Hired Date</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={teacher.photo_url || ""} alt={`${teacher.first_name} ${teacher.last_name}`} />
                            <AvatarFallback className={`${getAvatarColor(teacher.first_name)} text-white text-xs`}>
                              {getInitials(teacher.first_name, teacher.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">{teacher.employee_number || 'N/A'}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{teacher.first_name} {teacher.last_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="text-xs sm:text-sm">{teacher.phone || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{teacher.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {teacher.specialization ? (
                            <Badge variant="outline" className="text-xs">{teacher.specialization}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                          {teacher.hired_date 
                            ? new Date(teacher.hired_date).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
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
              )}
            </div>
          </CardContent>
        </Card>

        <AddTeacherDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
