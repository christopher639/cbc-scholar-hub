import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex flex-col h-full space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">Learners</h1>
            <p className="hidden sm:block text-sm text-muted-foreground">Manage and track all learner records</p>
          </div>
          <Button className="gap-1 sm:gap-2" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New Learner</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="shrink-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* Search - full width */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or admission no..." 
                  className="pl-9 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Dropdowns and buttons row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select value={selectedGrade || undefined} onValueChange={(value) => setSelectedGrade(value || "")}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
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
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
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
                <Button variant="outline" size="sm" className="h-9 gap-1 text-xs sm:text-sm">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-xs sm:text-sm">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learners Table */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">All Learners ({filteredLearners.length})</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Complete list of enrolled learners</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 sm:px-6 sm:pb-6">
            {loading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredLearners.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4 text-sm">No learners found</p>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Learner
                </Button>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="border-b border-border bg-muted/50 sticky top-0 z-10">
                    <tr className="text-left font-medium text-muted-foreground">
                      <th className="p-2 sm:p-3 whitespace-nowrap">Photo</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">Adm No.</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap">Name</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap hidden md:table-cell">Grade</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap hidden md:table-cell">Stream</th>
                      <th className="p-2 sm:p-3 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLearners.map((learner) => (
                      <tr 
                        key={learner.id} 
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/learner/${learner.id}`)}
                      >
                        <td className="p-2 sm:p-3">
                          {learner.photo_url ? (
                            <img 
                              src={learner.photo_url} 
                              alt={`${learner.first_name} ${learner.last_name}`}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="p-2 sm:p-3">
                          <span className="font-medium text-primary whitespace-nowrap">
                            {learner.admission_number}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3">
                          <span className="font-medium text-foreground whitespace-nowrap">
                            {learner.first_name} {learner.last_name}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{learner.current_grade?.name || 'N/A'}</Badge>
                        </td>
                        <td className="p-2 sm:p-3 hidden md:table-cell">
                          <Badge variant="secondary" className="text-xs">{learner.current_stream?.name || 'N/A'}</Badge>
                        </td>
                        <td className="p-2 sm:p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
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
