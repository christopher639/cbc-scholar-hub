import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download, Eye, Edit, MoreVertical } from "lucide-react";
import { AddLearnerDialog } from "@/components/AddLearnerDialog";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLearners } from "@/hooks/useLearners";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { learners, loading } = useLearners();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Learners</h1>
            <p className="text-muted-foreground">Manage and track all learner records</p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Learner
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search learner by name, admission number..." className="pl-9" />
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

        {/* Learners Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Learners ({learners.length})</CardTitle>
            <CardDescription>Complete list of enrolled learners</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : learners.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No learners found</p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Learner
                    </Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left text-sm font-medium text-muted-foreground">
                        <th className="pb-3 pr-4">Admission No.</th>
                        <th className="pb-3 pr-4">Learner Name</th>
                        <th className="pb-3 pr-4">Grade</th>
                        <th className="pb-3 pr-4">Stream</th>
                        <th className="pb-3 pr-4">Gender</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {learners.map((learner) => (
                        <tr key={learner.id} className="text-sm hover:bg-muted/50 transition-colors">
                          <td className="py-4 pr-4">
                            <Link to={`/learners/${learner.id}`} className="font-medium text-primary hover:underline">
                              {learner.admission_number}
                            </Link>
                          </td>
                          <td className="py-4 pr-4">
                            <Link to={`/learners/${learner.id}`}>
                              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-primary">
                                    {learner.first_name?.[0]}{learner.last_name?.[0]}
                                  </span>
                                </div>
                                <span className="font-medium text-foreground hover:text-primary transition-colors">
                                  {learner.first_name} {learner.last_name}
                                </span>
                              </div>
                            </Link>
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground">{learner.current_grade?.name || 'N/A'}</td>
                          <td className="py-4 pr-4">
                            <Badge variant="secondary">{learner.current_stream?.name || 'N/A'}</Badge>
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground capitalize">{learner.gender}</td>
                          <td className="py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/learners/${learner.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Learner
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
          </CardContent>
        </Card>
      </div>

      <AddLearnerDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </DashboardLayout>
  );
};

export default Students;
