import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Users, Building2, Wallet, MoreHorizontal, Eye } from "lucide-react";
import { useNonTeachingStaff } from "@/hooks/useNonTeachingStaff";
import { AddNonTeachingStaffDialog } from "@/components/AddNonTeachingStaffDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Compact Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Non-Teaching Staff</h1>
              <p className="text-sm text-muted-foreground">Manage support staff</p>
            </div>
            
            {/* Inline Stats for Large Screens */}
            <div className="hidden lg:flex items-center gap-4 ml-4 pl-4 border-l">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold">{loading ? "..." : staff.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded">
                  <Building2 className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Depts</p>
                  <p className="text-sm font-semibold">{loading ? "..." : departments}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded">
                  <Wallet className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="text-sm font-semibold">{loading ? "..." : `${(totalSalaries / 1000).toFixed(0)}K`}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Add Staff
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
                <p className="text-lg font-bold">{loading ? "..." : staff.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Depts</p>
                <p className="text-lg font-bold">{loading ? "..." : departments}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="text-lg font-bold">{loading ? "..." : `${(totalSalaries / 1000).toFixed(0)}K`}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Staff Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  {searchQuery ? "No staff match your search" : "No staff members found"}
                </p>
                {!searchQuery && (
                  <Button size="sm" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Staff
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10 py-2"></TableHead>
                      <TableHead className="py-2 text-xs font-medium">Name</TableHead>
                      <TableHead className="py-2 text-xs font-medium">Job Title</TableHead>
                      <TableHead className="py-2 text-xs font-medium hidden md:table-cell">Department</TableHead>
                      <TableHead className="py-2 text-xs font-medium hidden lg:table-cell">Contact</TableHead>
                      <TableHead className="py-2 text-xs font-medium">Status</TableHead>
                      <TableHead className="py-2 text-xs font-medium text-right hidden md:table-cell">Salary</TableHead>
                      <TableHead className="py-2 text-xs font-medium w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((member) => (
                      <TableRow key={member.id} className="hover:bg-muted/30">
                        <TableCell className="py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.photo_url || ""} />
                            <AvatarFallback className={`${getAvatarColor(member.first_name)} text-white text-xs`}>
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="py-2">
                          <div>
                            <p className="text-sm font-medium">{member.first_name} {member.last_name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-sm">{member.job_title}</TableCell>
                        <TableCell className="py-2 text-sm hidden md:table-cell">{member.department || "-"}</TableCell>
                        <TableCell className="py-2 hidden lg:table-cell">
                          <div className="text-xs">
                            <p>{member.email}</p>
                            <p className="text-muted-foreground">{member.phone || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm hidden md:table-cell">
                          {member.salary ? `KSh ${member.salary.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-3.5 w-3.5" />
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
            )}
          </CardContent>
        </Card>
      </div>

      <AddNonTeachingStaffDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </DashboardLayout>
  );
}