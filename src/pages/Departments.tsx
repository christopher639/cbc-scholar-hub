import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDepartments } from "@/hooks/useDepartments";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, Users, Loader2 } from "lucide-react";
import { useVisitorAccess } from "@/hooks/useVisitorAccess";

export default function Departments() {
  const { departments, loading, addDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { toast } = useToast();
  const { checkAccess } = useVisitorAccess();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  
  // Filter state
  const [filterDeptId, setFilterDeptId] = useState<string>("");
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const handleAdd = async () => {
    if (!checkAccess("add departments")) return;
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Department name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addDepartment(formData);
      setFormData({ name: "", description: "" });
      setAddDialogOpen(false);
    } catch (error) {}
    setSubmitting(false);
  };

  const handleEdit = async () => {
    if (!checkAccess("edit departments")) return;
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Department name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await updateDepartment(selectedDepartment.id, formData);
      setEditDialogOpen(false);
      setSelectedDepartment(null);
    } catch (error) {}
    setSubmitting(false);
  };

  const handleDelete = async (dept: any) => {
    if (!checkAccess("delete departments")) return;
    if (confirm(`Delete department "${dept.name}"?`)) {
      await deleteDepartment(dept.id);
    }
  };

  const openEditDialog = (dept: any) => {
    setSelectedDepartment(dept);
    setFormData({ name: dept.name, description: dept.description || "" });
    setEditDialogOpen(true);
  };

  const filterTeachersByDepartment = async (deptId: string) => {
    setFilterDeptId(deptId);
    if (!deptId) {
      setFilteredTeachers([]);
      return;
    }
    setLoadingTeachers(true);
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("department_id", deptId)
        .order("first_name");
      if (error) throw error;
      setFilteredTeachers(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoadingTeachers(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Departments</h1>
            <p className="text-sm text-muted-foreground">Manage teacher departments</p>
          </div>
          <Button onClick={() => { setFormData({ name: "", description: "" }); setAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Department
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Departments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" /> All Departments ({departments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : departments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No departments created yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">{dept.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(dept)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(dept)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Filter Teachers by Department */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" /> Teachers by Department
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Department</Label>
                <Select value={filterDeptId} onValueChange={filterTeachersByDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department to filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingTeachers ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : filterDeptId && filteredTeachers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No teachers in this department</p>
              ) : filteredTeachers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emp No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-mono text-xs">{teacher.employee_number || "-"}</TableCell>
                        <TableCell>{teacher.first_name} {teacher.last_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{teacher.specialization || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : !filterDeptId && (
                <p className="text-muted-foreground text-center py-8">Select a department to view teachers</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Department</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Department Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Mathematics" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add Department
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Department Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
