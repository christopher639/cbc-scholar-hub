import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Filter,
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

const LearningAreas = () => {
  const { toast } = useToast();
  const { learningAreas, loading, addLearningArea, updateLearningArea, deleteLearningArea } = useLearningAreas();
  const { teachers } = useTeachers();
  
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredAreas = learningAreas.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const assignedCount = learningAreas.filter(a => a.teacher_id).length;

  // Split filtered areas into columns
  const getColumns = (items: any[], numCols: number) => {
    const cols: any[][] = Array.from({ length: numCols }, () => []);
    items.forEach((item, idx) => {
      cols[idx % numCols].push({ ...item, originalIndex: idx });
    });
    return cols;
  };

  const renderTable = (items: any[]) => (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10 py-2 text-xs font-medium">#</TableHead>
            <TableHead className="py-2 text-xs font-medium">Code</TableHead>
            <TableHead className="py-2 text-xs font-medium">Name</TableHead>
            <TableHead className="py-2 text-xs font-medium hidden md:table-cell">Teacher</TableHead>
            <TableHead className="py-2 text-xs font-medium w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((area) => (
            <TableRow key={area.id} className="hover:bg-muted/30">
              <TableCell className="py-2 text-sm text-muted-foreground">{area.originalIndex + 1}</TableCell>
              <TableCell className="py-2">
                <Badge variant="secondary" className="font-mono text-xs">{area.code}</Badge>
              </TableCell>
              <TableCell className="py-2">
                <div>
                  <p className="text-sm font-medium">{area.name}</p>
                  <p className="text-xs text-muted-foreground md:hidden">
                    {area.teacher ? `${area.teacher.first_name} ${area.teacher.last_name}` : 'Unassigned'}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-2 hidden md:table-cell">
                {area.teacher ? (
                  <span className="text-sm">{area.teacher.first_name} {area.teacher.last_name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Unassigned</span>
                )}
              </TableCell>
              <TableCell className="py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(area)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteConfirmId(area.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Compact Header with Stats - matching Teachers page */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Learning Areas</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage learning areas</p>
            </div>
            
            {/* Inline Stats for Large Screens */}
            <div className="hidden lg:flex items-center gap-4 ml-4 pl-4 border-l">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold">{loading ? "..." : learningAreas.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded">
                  <GraduationCap className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">With Teachers</p>
                  <p className="text-sm font-semibold">{loading ? "..." : assignedCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/10 rounded">
                  <Users className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unassigned</p>
                  <p className="text-sm font-semibold">{loading ? "..." : learningAreas.length - assignedCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search areas..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Add Area
            </Button>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{loading ? "..." : learningAreas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Assigned</p>
                <p className="text-lg font-bold">{loading ? "..." : assignedCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Unassigned</p>
                <p className="text-lg font-bold">{loading ? "..." : learningAreas.length - assignedCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Learning Areas Tables in Columns */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : filteredAreas.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  {searchQuery ? "No learning areas match your search" : "No learning areas found"}
                </p>
                {!searchQuery && (
                  <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Area
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 2 columns on sm, 3 on lg */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getColumns(filteredAreas, 3).map((col, colIdx) => (
                <div key={colIdx} className={colIdx === 2 ? "hidden lg:block" : ""}>
                  {col.length > 0 && renderTable(col)}
                </div>
              ))}
            </div>
            {/* Single column on mobile */}
            <div className="sm:hidden">
              {renderTable(filteredAreas.map((area, idx) => ({ ...area, originalIndex: idx })))}
            </div>
          </>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Learning Area</DialogTitle>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Learning Area</DialogTitle>
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
