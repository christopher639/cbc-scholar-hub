import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Filter, Download, Eye, Edit, MoreVertical, User } from "lucide-react";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { AddLearnerDialog } from "@/components/AddLearnerDialog";
import { EditLearnerDialog } from "@/components/EditLearnerDialog";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const Learners = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  const { learners, loading, fetchLearners } = useLearners(selectedGrade, selectedStream);
  const { grades } = useGrades();
  const { streams } = useStreams();

  // Filter streams based on selected grade
  const filteredStreams = selectedGrade
    ? streams.filter((stream) => stream.grade_id === selectedGrade)
    : streams;

  // Filter learners by search query
  const filteredLearners = learners.filter((learner) => {
    const fullName = `${learner.first_name} ${learner.last_name}`.toLowerCase();
    const admissionNumber = learner.admission_number?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || admissionNumber.includes(query);
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Learners</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track all learner records</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Learner
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
              <div className="relative sm:col-span-2 lg:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search learner by name, admission number..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedGrade || undefined} onValueChange={(value) => setSelectedGrade(value || "")}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStream || undefined} onValueChange={(value) => setSelectedStream(value || "")}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="All Streams" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStreams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">More Filters</span>
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Learners Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Learners ({filteredLearners.length})</CardTitle>
            <CardDescription>Complete list of enrolled learners</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredLearners.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No learners found</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Learner
                </Button>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-full">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left text-sm font-medium text-muted-foreground">
                        <th className="pb-3 pr-4 sticky left-0 bg-card z-10">Photo</th>
                        <th className="pb-3 pr-4 sticky left-[60px] sm:left-[80px] bg-card z-10">Admission No.</th>
                        <th className="pb-3 pr-4 sticky left-[140px] sm:left-[200px] bg-card z-10">Learner Name</th>
                        <th className="pb-3 pr-4 hidden lg:table-cell">Grade</th>
                        <th className="pb-3 pr-4 hidden lg:table-cell">Stream</th>
                        <th className="pb-3 sticky right-0 bg-card z-10">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredLearners.map((learner) => (
                        <tr 
                          key={learner.id} 
                          className="text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/learner/${learner.id}`)}
                        >
                          <td className="py-4 pr-4 sticky left-0 bg-card z-10">
                            {learner.photo_url ? (
                              <img 
                                src={learner.photo_url} 
                                alt={`${learner.first_name} ${learner.last_name}`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="py-4 pr-4 sticky left-[60px] sm:left-[80px] bg-card z-10">
                            <span className="font-medium text-primary text-xs sm:text-sm">
                              {learner.admission_number}
                            </span>
                          </td>
                          <td className="py-4 pr-4 sticky left-[140px] sm:left-[200px] bg-card z-10 min-w-[120px]">
                            <span className="font-medium text-foreground text-xs sm:text-sm">
                              {learner.first_name} {learner.last_name}
                            </span>
                          </td>
                          <td className="py-4 pr-4 hidden lg:table-cell">
                            <Badge variant="outline">{learner.current_grade?.name || 'N/A'}</Badge>
                          </td>
                          <td className="py-4 pr-4 hidden lg:table-cell">
                            <Badge variant="secondary">{learner.current_stream?.name || 'N/A'}</Badge>
                          </td>
                          <td className="py-4 sticky right-0 bg-card z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/learner/${learner.id}`);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLearner(learner);
                                  setIsEditDialogOpen(true);
                                }}>
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
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <AddLearnerDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <EditLearnerDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        learner={selectedLearner}
        onSuccess={fetchLearners}
      />
    </DashboardLayout>
  );
};

export default Learners;
