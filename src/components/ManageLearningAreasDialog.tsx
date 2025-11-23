import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Code, Loader2, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { useTeachers } from "@/hooks/useTeachers";

interface ManageLearningAreasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageLearningAreasDialog = ({ open, onOpenChange }: ManageLearningAreasDialogProps) => {
  const { toast } = useToast();
  const { learningAreas, loading, fetchLearningAreas, addLearningArea, deleteLearningArea } = useLearningAreas();
  const { teachers, loading: teachersLoading } = useTeachers();
  
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");

  useEffect(() => {
    if (open) {
      fetchLearningAreas();
    }
  }, [open]);

  const handleAdd = async () => {
    if (!newCode || !newName) {
      toast({
        title: "Missing Information",
        description: "Please provide code and name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addLearningArea({
        code: newCode.toUpperCase(),
        name: newName,
        teacher_id: newTeacherId || null,
      });

      setNewCode("");
      setNewName("");
      setNewTeacherId("");
    } catch (error) {
      // Error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this learning area?")) {
      return;
    }

    try {
      await deleteLearningArea(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (area: any) => {
    setEditingId(area.id);
    setEditCode(area.code);
    setEditName(area.name);
    setEditTeacherId(area.teacher_id || "");
  };

  const handleUpdate = async (id: string) => {
    if (!editCode || !editName) {
      toast({
        title: "Missing Information",
        description: "Please provide code and name",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("learning_areas")
        .update({
          code: editCode.toUpperCase(),
          name: editName,
          teacher_id: editTeacherId || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Learning area updated successfully",
      });

      setEditingId(null);
      fetchLearningAreas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCode("");
    setEditName("");
    setEditTeacherId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Learning Areas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Add New Learning Area</h3>
            <div className="grid grid-cols-3 gap-4 border border-border rounded-lg p-4 bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="code">
                  <Code className="h-3 w-3 inline mr-1" />
                  Code *
                </Label>
                <Input 
                  id="code" 
                  placeholder="e.g., MATH" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="uppercase font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaName">Learning Area Name *</Label>
                <Input 
                  id="areaName" 
                  placeholder="e.g., Mathematics" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherId">Assigned Teacher (Optional)</Label>
                <Select value={newTeacherId} onValueChange={setNewTeacherId} disabled={teachersLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={teachersLoading ? "Loading..." : "Select teacher"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button type="button" onClick={handleAdd} className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Area
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Current Learning Areas</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : learningAreas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No learning areas yet</p>
            ) : (
              <div className="space-y-2">
                {learningAreas.map((area) => (
                  <div key={area.id} className="p-4 border border-border rounded-lg bg-card">
                    {editingId === area.id ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Code</Label>
                          <Input
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            className="uppercase font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Teacher</Label>
                          <Select value={editTeacherId || "none"} onValueChange={(val) => setEditTeacherId(val === "none" ? "" : val)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
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
                        <div className="col-span-3 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(area.id)}
                            disabled={submitting}
                          >
                            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                            {area.code}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{area.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {area.teacher ? `${area.teacher.first_name} ${area.teacher.last_name}` : "No teacher assigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(area)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(area.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ManageLearningAreasDialog };
