import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download, Eye, Edit, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Students = () => {
  const students = [
    {
      admissionNo: "ADM001",
      name: "John Kamau Mwangi",
      grade: "Grade 4",
      stream: "Green",
      gender: "Male",
      status: "Active",
      feeBalance: 15000,
    },
    {
      admissionNo: "ADM002",
      name: "Mary Wanjiku Njeri",
      grade: "Grade 1",
      stream: "Red",
      gender: "Female",
      status: "Active",
      feeBalance: 0,
    },
    {
      admissionNo: "ADM003",
      name: "David Omondi Otieno",
      grade: "Grade 3",
      stream: "Blue",
      gender: "Male",
      status: "Active",
      feeBalance: 8500,
    },
    {
      admissionNo: "ADM004",
      name: "Grace Akinyi Adhiambo",
      grade: "Grade 2",
      stream: "Yellow",
      gender: "Female",
      status: "Active",
      feeBalance: 5000,
    },
    {
      admissionNo: "ADM005",
      name: "Peter Kipchoge Rotich",
      grade: "Grade 5",
      stream: "Green",
      gender: "Male",
      status: "Active",
      feeBalance: 0,
    },
    {
      admissionNo: "ADM006",
      name: "Sarah Njoki Kariuki",
      grade: "Grade 6",
      stream: "Red",
      gender: "Female",
      status: "Active",
      feeBalance: 12000,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground">Manage and track all student records</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Student
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, admission number..." className="pl-9" />
              </div>
              <Select>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                  <SelectItem value="6">Grade 6</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Stream" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Students ({students.length})</CardTitle>
            <CardDescription>Complete list of enrolled students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Admission No.</th>
                    <th className="pb-3 pr-4">Student Name</th>
                    <th className="pb-3 pr-4">Grade</th>
                    <th className="pb-3 pr-4">Stream</th>
                    <th className="pb-3 pr-4">Gender</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Fee Balance</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.admissionNo} className="text-sm">
                      <td className="py-4 pr-4">
                        <span className="font-mono font-medium text-foreground">{student.admissionNo}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-foreground">{student.grade}</td>
                      <td className="py-4 pr-4">
                        <Badge variant="secondary">{student.stream}</Badge>
                      </td>
                      <td className="py-4 pr-4 text-foreground">{student.gender}</td>
                      <td className="py-4 pr-4">
                        <Badge variant="outline" className="border-success text-success">
                          {student.status}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">
                        {student.feeBalance > 0 ? (
                          <span className="font-semibold text-warning">KES {student.feeBalance.toLocaleString()}</span>
                        ) : (
                          <span className="font-semibold text-success">Paid</span>
                        )}
                      </td>
                      <td className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Students;
