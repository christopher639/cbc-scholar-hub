import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download, Eye, Edit, MoreVertical, User, X, ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Learners = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  
  const { learners, loading, fetchLearners } = useLearners(selectedGrade, selectedStream);
  const { grades } = useGrades();
  const { streams } = useStreams();
  
  const hasActiveFilters = selectedGrade || selectedStream;
  
  const clearFilters = () => {
    setSelectedGrade("");
    setSelectedStream("");
  };

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
      <div className="flex flex-col h-full space-y-4">
        {/* Header with Search and Filter inline */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">Learners</h1>
          
          {/* Search, Filter, and Add Button Row */}
          <div className="flex items-center gap-2 flex-1 lg:max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name or admission no..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant={showFilters || hasActiveFilters ? "default" : "outline"} 
              size="sm" 
              className="gap-1 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
                  {(selectedGrade ? 1 : 0) + (selectedStream ? 1 : 0)}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            <Button className="gap-1 shrink-0" size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Learner</span>
            </Button>
          </div>
        </div>

        {/* Collapsible Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="shrink-0">
            <Card className="border-dashed">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={selectedGrade || undefined} onValueChange={(value) => setSelectedGrade(value || "")}>
                    <SelectTrigger className="w-[160px]">
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
                    <SelectTrigger className="w-[160px]">
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
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Learners Table */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Learners ({filteredLearners.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
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
              <div className="h-full overflow-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 sticky top-0 z-10">
                    <tr className="text-left font-medium text-muted-foreground">
                      <th className="p-3 whitespace-nowrap w-12">Photo</th>
                      <th className="p-3 whitespace-nowrap">Adm No.</th>
                      <th className="p-3 whitespace-nowrap">Name</th>
                      <th className="p-3 whitespace-nowrap hidden lg:table-cell">Gender</th>
                      <th className="p-3 whitespace-nowrap hidden md:table-cell">Grade</th>
                      <th className="p-3 whitespace-nowrap hidden md:table-cell">Stream</th>
                      <th className="p-3 whitespace-nowrap hidden xl:table-cell">Status</th>
                      <th className="p-3 whitespace-nowrap hidden xl:table-cell">Boarding</th>
                      <th className="p-3 whitespace-nowrap text-right w-12">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLearners.map((learner) => (
                      <tr 
                        key={learner.id} 
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/learner/${learner.id}`)}
                      >
                        <td className="p-3">
                          {learner.photo_url ? (
                            <img 
                              src={learner.photo_url} 
                              alt={`${learner.first_name} ${learner.last_name}`}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-primary whitespace-nowrap">
                            {learner.admission_number}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-foreground whitespace-nowrap">
                            {learner.first_name} {learner.last_name}
                          </span>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <span className="text-muted-foreground capitalize">{learner.gender || 'N/A'}</span>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <Badge variant="outline">{learner.current_grade?.name || 'N/A'}</Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <Badge variant="secondary">{learner.current_stream?.name || 'N/A'}</Badge>
                        </td>
                        <td className="p-3 hidden xl:table-cell">
                          <Badge variant={learner.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {learner.status || 'active'}
                          </Badge>
                        </td>
                        <td className="p-3 hidden xl:table-cell">
                          <span className="text-muted-foreground capitalize">{learner.boarding_status || 'day'}</span>
                        </td>
                        <td className="p-3 text-right">
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
