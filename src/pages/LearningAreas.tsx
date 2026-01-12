import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { useTeachers } from "@/hooks/useTeachers";
import { 
  Plus, 
  BookOpen, 
  Pencil, 
  Trash2, 
  Search,
  Loader2,
  GraduationCap,
  Users,
  MoreHorizontal
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterType = "all" | "assigned" | "unassigned";

const LearningAreas = () => {
  const { toast } = useToast();
  const { learningAreas, loading, addLearningArea, updateLearningArea, deleteLearningArea } = useLearningAreas();
  const { teachers } = useTeachers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    teacher_id: "",
  });
  
  const [editData, setEditData] = useState<any>(null);

  const assignedCount = learningAreas.filter(a => a.teacher_id).length;
  const unassignedCount = learningAreas.length - assignedCount;

  const filteredAreas = learningAreas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case "assigned":
        return area.teacher_id !== null;
      case "unassigned":
        return area.teacher_id === null;
      default:
        return true;
    }
  });

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", teacher_id: "" });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      await addLearningArea({
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        teacher_id: formData.teacher_id || null,
      });
      resetForm();
      setIsAddDialogOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (area: any) => {
    setEditData({
      id: area.id,
      name: area.name,
      code: area.code,
      description: area.description || "",
      teacher_id: area.teacher_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editData?.name || !editData?.code) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      await updateLearningArea(editData.id, {
        name: editData.name,
        code: editData.code.toUpperCase(),
        description: editData.description || null,
        teacher_id: editData.teacher_id || null,
      });
      setIsEditDialogOpen(false);
      setEditData(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    setFormLoading(true);
    try {
      await deleteLearningArea(deleteConfirmId);
      setDeleteConfirmId(null);
    } finally {
      setFormLoading(false);
    }
  };

  const getTeacherInitials = (teacher: any) => {
    if (!teacher) return "?";
    return `${teacher.first_name?.[0] || ""}${teacher.last_name?.[0] || ""}`.toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl font-bold text-foreground">Learning Areas</h1>
          
          <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:justify-end">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search learning areas..."
                className="pl-8 h-9 bg-background border-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="h-9 shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add Area</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Main Card with Stats and Table */}
        <Card>
          <CardHeader className="pb-4">
            {/* Clickable Stats Cards */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-colors ${
                  activeFilter === "all"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeFilter === "all" ? "bg-primary/20" : "bg-muted"}`}>
                  <BookOpen className={`h-4 w-4 ${activeFilter === "all" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-sm font-semibold">{loading ? "..." : learningAreas.length}</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter("assigned")}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-colors ${
                  activeFilter === "assigned"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeFilter === "assigned" ? "bg-primary/20" : "bg-muted"}`}>
                  <GraduationCap className={`h-4 w-4 ${activeFilter === "assigned" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground font-medium">Assigned</p>
                  <p className="text-sm font-semibold">{loading ? "..." : assignedCount}</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter("unassigned")}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-colors ${
                  activeFilter === "unassigned"
                    ? "bg-accent border-accent text-accent-foreground"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeFilter === "unassigned" ? "bg-accent" : "bg-muted"}`}>
                  <Users className={`h-4 w-4 ${activeFilter === "unassigned" ? "text-accent-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground font-medium">Unassigned</p>
                  <p className="text-sm font-semibold">{loading ? "..." : unassignedCount}</p>
                </div>
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  {searchQuery || activeFilter !== "all" 
                    ? "No learning areas match your criteria" 
                    : "No learning areas found"}
                </p>
                {!searchQuery && activeFilter === "all" && (
                  <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Area
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10 text-xs">#</TableHead>
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Teacher</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Description</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.map((area, index) => (
                      <TableRow key={area.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">{area.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{area.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">
                              {area.teacher ? `${area.teacher.first_name} ${area.teacher.last_name}` : "Unassigned"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {area.teacher ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getTeacherInitials(area.teacher)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{area.teacher.first_name} {area.teacher.last_name}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {area.description || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(area)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteConfirmId(area.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Learning Area</DialogTitle>
            <DialogDescription>
              Create a new learning area for tracking student performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Mathematics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. MATH"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this learning area"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Assign Teacher</Label>
              <Select
                value={formData.teacher_id}
                onValueChange={(value) => setFormData({ ...formData, teacher_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No teacher</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Learning Area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditData(null); }}>
        <DialogContent className="border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Learning Area</DialogTitle>
            <DialogDescription>
              Update the learning area details
            </DialogDescription>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Code *</Label>
                  <Input
                    id="edit-code"
                    value={editData.code}
                    onChange={(e) => setEditData({ ...editData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-teacher">Assign Teacher</Label>
                <Select
                  value={editData.teacher_id || "none"}
                  onValueChange={(value) => setEditData({ ...editData, teacher_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No teacher</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditData(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Learning Area?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the learning area and may affect existing performance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default LearningAreas;
