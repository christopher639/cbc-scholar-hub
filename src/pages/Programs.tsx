import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, BookOpen, GraduationCap, Award, Users, Lightbulb, Heart, Star, Palette, Music, Trophy, Cpu } from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

const iconOptions = [
  { value: "BookOpen", label: "Book", icon: BookOpen },
  { value: "GraduationCap", label: "Graduation", icon: GraduationCap },
  { value: "Award", label: "Award", icon: Award },
  { value: "Users", label: "Users", icon: Users },
  { value: "Lightbulb", label: "Lightbulb", icon: Lightbulb },
  { value: "Heart", label: "Heart", icon: Heart },
  { value: "Star", label: "Star", icon: Star },
  { value: "Palette", label: "Art", icon: Palette },
  { value: "Music", label: "Music", icon: Music },
  { value: "Trophy", label: "Trophy", icon: Trophy },
  { value: "Cpu", label: "Tech", icon: Cpu },
];

const colorOptions = [
  { value: "bg-blue-500/10 text-blue-600", label: "Blue" },
  { value: "bg-green-500/10 text-green-600", label: "Green" },
  { value: "bg-purple-500/10 text-purple-600", label: "Purple" },
  { value: "bg-orange-500/10 text-orange-600", label: "Orange" },
  { value: "bg-cyan-500/10 text-cyan-600", label: "Cyan" },
  { value: "bg-pink-500/10 text-pink-600", label: "Pink" },
  { value: "bg-red-500/10 text-red-600", label: "Red" },
  { value: "bg-yellow-500/10 text-yellow-600", label: "Yellow" },
];

export default function Programs() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "BookOpen",
    color: "bg-blue-500/10 text-blue-600",
    display_order: 0,
    is_active: true,
  });

  const fetchPrograms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to load programs", variant: "destructive" });
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const openAddDialog = () => {
    setEditingProgram(null);
    setForm({
      title: "",
      description: "",
      icon: "BookOpen",
      color: "bg-blue-500/10 text-blue-600",
      display_order: programs.length,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (program: Program) => {
    setEditingProgram(program);
    setForm({
      title: program.title,
      description: program.description || "",
      icon: program.icon,
      color: program.color,
      display_order: program.display_order,
      is_active: program.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      if (editingProgram) {
        const { error } = await supabase
          .from("programs")
          .update({
            title: form.title.trim(),
            description: form.description.trim() || null,
            icon: form.icon,
            color: form.color,
            display_order: form.display_order,
            is_active: form.is_active,
          })
          .eq("id", editingProgram.id);

        if (error) throw error;
        toast({ title: "Success", description: "Program updated successfully" });
      } else {
        const { error } = await supabase.from("programs").insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          icon: form.icon,
          color: form.color,
          display_order: form.display_order,
          is_active: form.is_active,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Program created successfully" });
      }

      setDialogOpen(false);
      fetchPrograms();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!programToDelete) return;

    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programToDelete.id);

      if (error) throw error;

      toast({ title: "Success", description: "Program deleted successfully" });
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
      fetchPrograms();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option?.icon || BookOpen;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading programs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Programs</h1>
            <p className="text-sm text-muted-foreground">Manage school programs displayed on the public website</p>
          </div>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Program
          </Button>
        </div>

        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No programs added yet. Click "Add Program" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {programs.map((program) => {
              const Icon = getIconComponent(program.icon);
              return (
                <Card key={program.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${program.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium truncate">{program.title}</h3>
                          <Badge variant={program.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {program.is_active ? "Active" : "Hidden"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {program.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Order: {program.display_order}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditDialog(program)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          setProgramToDelete(program);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProgram ? "Edit Program" : "Add Program"}</DialogTitle>
            <DialogDescription>
              {editingProgram ? "Update the program details" : "Create a new program for the public website"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Early Years Education"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the program"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={(value) => setForm({ ...form, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={form.color} onValueChange={(value) => setForm({ ...form, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded ${option.value.split(" ")[0]}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProgram ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{programToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
