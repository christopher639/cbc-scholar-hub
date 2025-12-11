import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Users, Building2, Wallet, MoreHorizontal, Eye } from "lucide-react";
import { useNonTeachingStaff } from "@/hooks/useNonTeachingStaff";
import { AddNonTeachingStaffDialog } from "@/components/AddNonTeachingStaffDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

  // Mobile card component
  const StaffCard = ({ member }: { member: any }) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.photo_url || ""} alt={`${member.first_name} ${member.last_name}`} />
          <AvatarFallback className={`${getAvatarColor(member.first_name)} text-white`}>
            {getInitials(member.first_name, member.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">{member.first_name} {member.last_name}</h3>
              <p className="text-sm text-muted-foreground">{member.job_title}</p>
            </div>
            <Badge variant={member.status === "active" ? "default" : "secondary"}>
              {member.status}
            </Badge>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground">{member.email}</p>
            <p className="text-sm text-muted-foreground">{member.phone || 'No phone'}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {member.department && (
              <Badge variant="outline">{member.department}</Badge>
            )}
            {member.salary && (
              <Badge variant="secondary">
                KSh {member.salary.toLocaleString()}
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Non-Teaching Staff</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and view all support staff members
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
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
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : staff.length}</p>
                  <p className="text-xs text-muted-foreground">{activeStaff} active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Departments</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : departments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Monthly</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? "..." : `${(totalSalaries / 1000).toFixed(0)}K`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Directory */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Staff Directory</CardTitle>
            <CardDescription>Search and manage all support staff</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search & Filter */}
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, job title, email..."
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
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No staff match your search" : "No staff members found"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Staff Member
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 md:hidden">
                  {filteredStaff.map((member) => (
                    <StaffCard key={member.id} member={member} />
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Photo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead className="hidden lg:table-cell">Department</TableHead>
                        <TableHead className="hidden xl:table-cell">Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Salary</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.photo_url || ""} alt={`${member.first_name} ${member.last_name}`} />
                              <AvatarFallback className={`${getAvatarColor(member.first_name)} text-white text-sm`}>
                                {getInitials(member.first_name, member.last_name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.first_name} {member.last_name}
                          </TableCell>
                          <TableCell>{member.job_title}</TableCell>
                          <TableCell className="hidden lg:table-cell">{member.department || "-"}</TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <div className="space-y-0.5">
                              <div className="text-sm">{member.email}</div>
                              <div className="text-sm text-muted-foreground">{member.phone || "-"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.status === "active" ? "default" : "secondary"}>
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
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
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
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
      </div>

      <AddNonTeachingStaffDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </DashboardLayout>
  );
}