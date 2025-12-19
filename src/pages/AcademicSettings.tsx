import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useExamTypes } from "@/hooks/useExamTypes";
import { useGradingScales } from "@/hooks/useGradingScales";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Plus, FileText, Trash2, Edit2, Award } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export default function AcademicSettings() {
  const { academicYears, currentYear, refetch: refetchYears } = useAcademicYears();
  const { academicPeriods, currentPeriod, refetch: refetchPeriods } = useAcademicPeriods();
  const { examTypes, addExamType, updateExamType, deleteExamType } = useExamTypes();
  const { gradingScales, addGradingScale, updateGradingScale, deleteGradingScale } = useGradingScales();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [newTermYear, setNewTermYear] = useState("");
  const [newTerm, setNewTerm] = useState<"term_1" | "term_2" | "term_3">("term_1");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [examTypeDialogOpen, setExamTypeDialogOpen] = useState(false);
  const [newExamTypeName, setNewExamTypeName] = useState("");
  const [newExamTypeDescription, setNewExamTypeDescription] = useState("");
  const [newExamTypeMaxMarks, setNewExamTypeMaxMarks] = useState("100");
  const [editingExamType, setEditingExamType] = useState<{ id: string; name: string; description: string; max_marks: number } | null>(null);
  
  // Grading scale state
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeMinPct, setNewGradeMinPct] = useState("");
  const [newGradeMaxPct, setNewGradeMaxPct] = useState("");
  const [newGradePoints, setNewGradePoints] = useState("");
  const [newGradeDescription, setNewGradeDescription] = useState("");
  const [editingGrade, setEditingGrade] = useState<{ id: string; grade_name: string; min_percentage: number; max_percentage: number; points: number; description: string } | null>(null);

  const handleSetActiveYear = async (yearId: string) => {
    try {
      setLoading(true);
      
      // Set all years to inactive
      await supabase
        .from("academic_years")
        .update({ is_active: false })
        .neq("id", yearId);
      
      // Set selected year to active
      const { error } = await supabase
        .from("academic_years")
        .update({ is_active: true })
        .eq("id", yearId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Active academic year updated successfully",
      });
      
      refetchYears();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetActivePeriod = async (periodId: string) => {
    try {
      setLoading(true);
      
      // Set all periods to not current
      await supabase
        .from("academic_periods")
        .update({ is_current: false })
        .neq("id", periodId);
      
      // Set selected period to current
      const { error } = await supabase
        .from("academic_periods")
        .update({ is_current: true })
        .eq("id", periodId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Active term updated successfully",
      });
      
      refetchPeriods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async () => {
    if (!newYear) {
      toast({
        title: "Error",
        description: "Please enter an academic year",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("academic_years")
        .insert({ year: newYear, is_active: false });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Academic year created successfully",
      });
      
      setNewYear("");
      setYearDialogOpen(false);
      refetchYears();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerm = async () => {
    if (!newTermYear || !newStartDate || !newEndDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("academic_periods")
        .insert({
          academic_year: newTermYear,
          term: newTerm,
          start_date: newStartDate,
          end_date: newEndDate,
          is_current: false,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Term created successfully",
      });
      
      setNewTermYear("");
      setNewStartDate("");
      setNewEndDate("");
      setTermDialogOpen(false);
      refetchPeriods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExamType = async () => {
    if (!newExamTypeName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an exam type name",
        variant: "destructive",
      });
      return;
    }

    await addExamType.mutateAsync({ 
      name: newExamTypeName.trim(), 
      description: newExamTypeDescription.trim() || undefined,
      max_marks: parseInt(newExamTypeMaxMarks) || 100
    });
    
    setNewExamTypeName("");
    setNewExamTypeDescription("");
    setNewExamTypeMaxMarks("100");
    setExamTypeDialogOpen(false);
  };

  const handleUpdateExamType = async () => {
    if (!editingExamType || !editingExamType.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an exam type name",
        variant: "destructive",
      });
      return;
    }

    await updateExamType.mutateAsync({ 
      id: editingExamType.id,
      name: editingExamType.name.trim(), 
      description: editingExamType.description.trim() || undefined,
      max_marks: editingExamType.max_marks
    });
    
    setEditingExamType(null);
  };

  const handleCreateGradingScale = async () => {
    if (!newGradeName.trim() || !newGradeMinPct || !newGradeMaxPct) {
      toast({
        title: "Error",
        description: "Please fill in grade name and percentage range",
        variant: "destructive",
      });
      return;
    }

    await addGradingScale.mutateAsync({
      grade_name: newGradeName.trim(),
      min_percentage: parseFloat(newGradeMinPct),
      max_percentage: parseFloat(newGradeMaxPct),
      points: parseFloat(newGradePoints) || 0,
      description: newGradeDescription.trim() || undefined
    });

    setNewGradeName("");
    setNewGradeMinPct("");
    setNewGradeMaxPct("");
    setNewGradePoints("");
    setNewGradeDescription("");
    setGradingDialogOpen(false);
  };

  const handleUpdateGradingScale = async () => {
    if (!editingGrade || !editingGrade.grade_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a grade name",
        variant: "destructive",
      });
      return;
    }

    await updateGradingScale.mutateAsync({
      id: editingGrade.id,
      grade_name: editingGrade.grade_name.trim(),
      min_percentage: editingGrade.min_percentage,
      max_percentage: editingGrade.max_percentage,
      points: editingGrade.points,
      description: editingGrade.description.trim() || undefined
    });

    setEditingGrade(null);
  };

  const handleDeleteGradingScale = async (id: string) => {
    if (confirm("Are you sure you want to delete this grading scale?")) {
      await deleteGradingScale.mutateAsync(id);
    }
  };

  const handleDeleteExamType = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam type?")) {
      await deleteExamType.mutateAsync(id);
    }
  };

  const handleToggleExamTypeActive = async (id: string, currentStatus: boolean) => {
    await updateExamType.mutateAsync({ 
      id,
      is_active: !currentStatus
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Academic Settings</h1>
          <p className="text-muted-foreground">
            Configure active academic year and term for fee calculations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Academic Year */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Active Academic Year
                  </CardTitle>
                  <CardDescription>
                    Set the current academic year for all fee calculations
                  </CardDescription>
                </div>
                <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Year
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Academic Year</DialogTitle>
                      <DialogDescription>
                        Add a new academic year to the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Academic Year</Label>
                        <Input
                          placeholder="e.g., 2024-2025"
                          value={newYear}
                          onChange={(e) => setNewYear(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setYearDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateYear} disabled={loading}>
                        Create Year
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Academic Year</Label>
                <Select
                  value={currentYear?.id}
                  onValueChange={handleSetActiveYear}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentYear && (
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Current Year: {currentYear.year}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Term */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Active Term
                  </CardTitle>
                  <CardDescription>
                    Set the current term for fee assignments and payments
                  </CardDescription>
                </div>
                <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Term
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Term</DialogTitle>
                      <DialogDescription>
                        Add a new term to the academic calendar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Academic Year</Label>
                        <Select value={newTermYear} onValueChange={setNewTermYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year.id} value={year.year}>
                                {year.year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Term</Label>
                        <Select value={newTerm} onValueChange={(val: any) => setNewTerm(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="term_1">Term 1</SelectItem>
                            <SelectItem value="term_2">Term 2</SelectItem>
                            <SelectItem value="term_3">Term 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={newStartDate}
                            onChange={(e) => setNewStartDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={newEndDate}
                            onChange={(e) => setNewEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTermDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTerm} disabled={loading}>
                        Create Term
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentYear ? (
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Terms for {currentYear.year}
                  </Label>
                  {academicPeriods
                    .filter(p => p.academic_year === currentYear?.year)
                    .sort((a, b) => a.term.localeCompare(b.term))
                    .map((period) => (
                      <div
                        key={period.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {period.term.replace("_", " ").toUpperCase()}
                              </p>
                              {period.is_current && (
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`term-${period.id}`} className="text-sm text-muted-foreground">
                            Set as Current
                          </Label>
                          <Switch
                            id={`term-${period.id}`}
                            checked={period.is_current}
                            onCheckedChange={() => handleSetActivePeriod(period.id)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    ))}
                  {academicPeriods.filter(p => p.academic_year === currentYear?.year).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No terms created for this academic year. Click "New Term" to add one.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Please set an active academic year first
                </div>
              )}
              
              {currentPeriod && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md mt-4">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Current Active Term: {currentPeriod.term.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exam Types */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Exam Types
                  </CardTitle>
                  <CardDescription>
                    Manage exam types that will appear when adding learner marks
                  </CardDescription>
                </div>
                <Dialog open={examTypeDialogOpen} onOpenChange={setExamTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Exam Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Exam Type</DialogTitle>
                      <DialogDescription>
                        Add a new exam type that will be available when recording learner performance
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Exam Type Name *</Label>
                        <Input
                          placeholder="e.g., Mid-Term, CAT 1, End Term"
                          value={newExamTypeName}
                          onChange={(e) => setNewExamTypeName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Marks *</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 100, 50, 30"
                          value={newExamTypeMaxMarks}
                          onChange={(e) => setNewExamTypeMaxMarks(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          The maximum marks for this exam type (e.g., 30, 70, 100)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input
                          placeholder="Brief description of this exam type"
                          value={newExamTypeDescription}
                          onChange={(e) => setNewExamTypeDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setExamTypeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateExamType} disabled={addExamType.isPending}>
                        Create Exam Type
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {examTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No exam types created yet. Click "New Exam Type" to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Max Marks</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examTypes.map((examType) => (
                      <TableRow key={examType.id}>
                        <TableCell className="font-medium">
                          {editingExamType?.id === examType.id ? (
                            <Input
                              value={editingExamType.name}
                              onChange={(e) => setEditingExamType({ ...editingExamType, name: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            examType.name
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingExamType?.id === examType.id ? (
                            <Input
                              type="number"
                              value={editingExamType.max_marks}
                              onChange={(e) => setEditingExamType({ ...editingExamType, max_marks: parseInt(e.target.value) || 100 })}
                              className="h-8 w-20"
                            />
                          ) : (
                            <Badge variant="outline">{examType.max_marks || 100}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingExamType?.id === examType.id ? (
                            <Input
                              value={editingExamType.description}
                              onChange={(e) => setEditingExamType({ ...editingExamType, description: e.target.value })}
                              className="h-8"
                              placeholder="Description"
                            />
                          ) : (
                            examType.description || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={examType.is_active ?? true}
                              onCheckedChange={() => handleToggleExamTypeActive(examType.id, examType.is_active ?? true)}
                            />
                            <Badge variant={examType.is_active ? "default" : "secondary"}>
                              {examType.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingExamType?.id === examType.id ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingExamType(null)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleUpdateExamType} disabled={updateExamType.isPending}>
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                              onClick={() => setEditingExamType({
                                  id: examType.id,
                                  name: examType.name,
                                  description: examType.description || "",
                                  max_marks: examType.max_marks || 100
                                })}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteExamType(examType.id)}
                                disabled={deleteExamType.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Grading System */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Grading System
                  </CardTitle>
                  <CardDescription>
                    Configure the grading scale used for learner performance reports and transcripts
                  </CardDescription>
                </div>
                <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Grading Scale</DialogTitle>
                      <DialogDescription>
                        Define a grade with its percentage range
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Grade Name *</Label>
                        <Input
                          placeholder="e.g., E.E, M.E, A, B+"
                          value={newGradeName}
                          onChange={(e) => setNewGradeName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Min Percentage *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 80"
                            value={newGradeMinPct}
                            onChange={(e) => setNewGradeMinPct(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Percentage *</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 100"
                            value={newGradeMaxPct}
                            onChange={(e) => setNewGradeMaxPct(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Points (Optional)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 1, 2, 3"
                          value={newGradePoints}
                          onChange={(e) => setNewGradePoints(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input
                          placeholder="e.g., Exceeding Expectations"
                          value={newGradeDescription}
                          onChange={(e) => setNewGradeDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateGradingScale} disabled={addGradingScale.isPending}>
                        Add Grade
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {gradingScales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No grading scales configured. Click "Add Grade" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-center">Range (%)</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradingScales.map((scale) => (
                      <TableRow key={scale.id}>
                        <TableCell className="font-medium">
                          {editingGrade?.id === scale.id ? (
                            <Input
                              value={editingGrade.grade_name}
                              onChange={(e) => setEditingGrade({ ...editingGrade, grade_name: e.target.value })}
                              className="h-8 w-20"
                            />
                          ) : (
                            <Badge variant="outline" className="text-base">{scale.grade_name}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingGrade?.id === scale.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editingGrade.min_percentage}
                                onChange={(e) => setEditingGrade({ ...editingGrade, min_percentage: parseFloat(e.target.value) || 0 })}
                                className="h-8 w-16"
                              />
                              <span>-</span>
                              <Input
                                type="number"
                                value={editingGrade.max_percentage}
                                onChange={(e) => setEditingGrade({ ...editingGrade, max_percentage: parseFloat(e.target.value) || 0 })}
                                className="h-8 w-16"
                              />
                            </div>
                          ) : (
                            `${scale.min_percentage} - ${scale.max_percentage}`
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingGrade?.id === scale.id ? (
                            <Input
                              type="number"
                              value={editingGrade.points}
                              onChange={(e) => setEditingGrade({ ...editingGrade, points: parseFloat(e.target.value) || 0 })}
                              className="h-8 w-16"
                            />
                          ) : (
                            scale.points || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {editingGrade?.id === scale.id ? (
                            <Input
                              value={editingGrade.description}
                              onChange={(e) => setEditingGrade({ ...editingGrade, description: e.target.value })}
                              className="h-8"
                              placeholder="Description"
                            />
                          ) : (
                            scale.description || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingGrade?.id === scale.id ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingGrade(null)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleUpdateGradingScale} disabled={updateGradingScale.isPending}>
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingGrade({
                                  id: scale.id,
                                  grade_name: scale.grade_name,
                                  min_percentage: scale.min_percentage,
                                  max_percentage: scale.max_percentage,
                                  points: scale.points || 0,
                                  description: scale.description || ""
                                })}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteGradingScale(scale.id)}
                                disabled={deleteGradingScale.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Academic Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Academic Year</p>
                <p className="text-2xl font-bold">{currentYear?.year || "Not Set"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Term</p>
                <p className="text-2xl font-bold">
                  {currentPeriod?.term.replace("_", " ").toUpperCase() || "Not Set"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold text-primary">
                  {currentYear && currentPeriod ? "Active" : "Incomplete"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
