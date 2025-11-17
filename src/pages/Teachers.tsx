import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddTeacherDialog } from "@/components/AddTeacherDialog";
import { Plus, Search, MoreHorizontal, Eye, Edit, UserMinus } from "lucide-react";

const Teachers = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const teachers = [
    { id: "1", tscNumber: "TSC001234", name: "Mrs. Jane Njeri", phone: "+254 712 345 678", email: "j.njeri@school.ac.ke", qualification: "Degree", subject: "Mathematics", employmentType: "Permanent" },
    { id: "2", tscNumber: "TSC005678", name: "Mr. John Kamau", phone: "+254 723 456 789", email: "j.kamau@school.ac.ke", qualification: "Masters", subject: "English", employmentType: "Permanent" },
    { id: "3", tscNumber: "TSC009012", name: "Mrs. Mary Akinyi", phone: "+254 734 567 890", email: "m.akinyi@school.ac.ke", qualification: "Degree", subject: "Science", employmentType: "Contract" },
    { id: "4", tscNumber: "TSC003456", name: "Mr. David Omondi", phone: "+254 745 678 901", email: "d.omondi@school.ac.ke", qualification: "Diploma", subject: "Social Studies", employmentType: "Permanent" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teachers</h1>
            <p className="text-muted-foreground">Manage teacher information and assignments</p>
          </div>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Teacher
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Permanent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">35</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">5</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Temporary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Teacher Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, TSC number, or subject..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>

            {/* Teachers Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TSC Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-mono text-sm">{teacher.tscNumber}</TableCell>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{teacher.phone}</div>
                          <div className="text-muted-foreground">{teacher.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{teacher.qualification}</Badge>
                      </TableCell>
                      <TableCell>{teacher.subject}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.employmentType === "Permanent" ? "default" : "outline"}>
                          {teacher.employmentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove Teacher
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <AddTeacherDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
