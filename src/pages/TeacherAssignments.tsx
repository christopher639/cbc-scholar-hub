import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useGrades } from "@/hooks/useGrades";

interface OutletContext {
  teacher: any;
}

export default function TeacherAssignments() {
  const { toast } = useToast();
  const { teacher } = useOutletContext<OutletContext>();
  const { currentPeriod } = useAcademicPeriods();
  const { grades } = useGrades();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [learningAreas, setLearningAreas] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    learning_area_id: "",
    grade_id: "",
    stream_id: "",
    due_date: "",
    total_marks: "100",
  });

  useEffect(() => {
    if (teacher) {
      fetchAssignments();
      fetchLearningAreas();
    }
  }, [teacher]);

  useEffect(() => {
    if (formData.grade_id) {
      fetchStreams(formData.grade_id);
    }
  }, [formData.grade_id]);

  const fetchAssignments = async () => {
    if (!teacher?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          learning_area:learning_areas(name, code),
          grade:grades(name),
          stream:streams(name)
        `)
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningAreas = async () => {
    if (!teacher?.id) return;
    
    const { data } = await supabase
      .from("learning_areas")
      .select("*")
      .eq("teacher_id", teacher.id);

    setLearningAreas(data || []);
  };

  const fetchStreams = async (gradeId: string) => {
    const { data } = await supabase
      .from("streams")
      .select("*")
      .eq("grade_id", gradeId);

    setStreams(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPeriod) {
      toast({
        title: "Error",
        description: "No active academic period found",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("assignments").insert({
        teacher_id: teacher.id,
        learning_area_id: formData.learning_area_id,
        grade_id: formData.grade_id,
        stream_id: formData.stream_id || null,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        total_marks: Number(formData.total_marks),
        academic_year: currentPeriod.academic_year,
        term: currentPeriod.term,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        learning_area_id: "",
        grade_id: "",
        stream_id: "",
        due_date: "",
        total_marks: "100",
      });
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage and create assignments</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Learning Area *</Label>
                  <Select
                    value={formData.learning_area_id}
                    onValueChange={(value) => setFormData({ ...formData, learning_area_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select learning area" />
                    </SelectTrigger>
                    <SelectContent>
                      {learningAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grade *</Label>
                  <Select
                    value={formData.grade_id}
                    onValueChange={(value) => setFormData({ ...formData, grade_id: value, stream_id: "" })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Stream (Optional)</Label>
                  <Select
                    value={formData.stream_id}
                    onValueChange={(value) => setFormData({ ...formData, stream_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All streams" />
                    </SelectTrigger>
                    <SelectContent>
                      {streams.map((stream) => (
                        <SelectItem key={stream.id} value={stream.id}>
                          {stream.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_marks">Total Marks *</Label>
                  <Input
                    id="total_marks"
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Assignment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {learningAreas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No learning areas assigned</p>
            <p className="text-sm text-muted-foreground">Contact the administrator to assign learning areas to you</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assignments yet</p>
                <p className="text-sm text-muted-foreground">Create your first assignment to get started</p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>{assignment.learning_area?.name}</span>
                        <span>•</span>
                        <span>{assignment.grade?.name}</span>
                        {assignment.stream && (
                          <>
                            <span>•</span>
                            <span>{assignment.stream.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground">{assignment.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Due:</span>{" "}
                      {format(new Date(assignment.due_date), "MMM dd, yyyy")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Marks:</span>{" "}
                      {assignment.total_marks}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
