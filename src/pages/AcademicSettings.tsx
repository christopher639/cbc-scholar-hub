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
import { useLearningAreaRegistration } from "@/hooks/useLearningAreaRegistration";
import { usePerformanceFormulas } from "@/hooks/usePerformanceFormulas";
import { useGrades } from "@/hooks/useGrades";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Plus, FileText, Trash2, Edit2, Award, BookOpen, User, X, Calculator } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AcademicSettings() {
  const { academicYears, currentYear, refetch: refetchYears } = useAcademicYears();
  const { academicPeriods, currentPeriod, refetch: refetchPeriods } = useAcademicPeriods();
  const { examTypes, addExamType, updateExamType, deleteExamType } = useExamTypes();
  const { gradingScales, addGradingScale, updateGradingScale, deleteGradingScale } = useGradingScales();
  const { 
    gradeLearningAreas, 
    learnerLearningAreas, 
    addGradeLearningAreas, 
    removeGradeLearningArea,
    addLearnerLearningAreas,
    removeLearnerLearningArea 
  } = useLearningAreaRegistration();
  const { grades } = useGrades();
  const { learningAreas } = useLearningAreas();
  const {
    formulas,
    formulaWeights,
    activeFormula,
    createFormula,
    setActiveFormula,
    deleteFormula,
    saveFormulaWeight,
    getFormulaWeights,
  } = usePerformanceFormulas();
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

  // Learning area registration state
  const [gradeRegDialogOpen, setGradeRegDialogOpen] = useState(false);
  const [learnerRegDialogOpen, setLearnerRegDialogOpen] = useState(false);
  const [selectedRegGrade, setSelectedRegGrade] = useState("");
  const [selectedRegYear, setSelectedRegYear] = useState("");
  const [selectedRegLearningAreas, setSelectedRegLearningAreas] = useState<string[]>([]);
  const [admissionNumberSearch, setAdmissionNumberSearch] = useState("");
  const [foundLearner, setFoundLearner] = useState<any>(null);
  const [searchingLearner, setSearchingLearner] = useState(false);

  // Formula settings state
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [newFormulaName, setNewFormulaName] = useState("");
  const [newFormulaDescription, setNewFormulaDescription] = useState("");
  const [selectedFormula, setSelectedFormula] = useState<string | null>(null);
  const [editingWeights, setEditingWeights] = useState<Record<string, number>>({});

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

  // Learning area registration handlers
  const handleSearchLearner = async () => {
    if (!admissionNumberSearch.trim()) {
      toast({
        title: "Error",
        description: "Please enter an admission number",
        variant: "destructive",
      });
      return;
    }

    setSearchingLearner(true);
    try {
      const { data, error } = await supabase
        .from("learners")
        .select("id, first_name, last_name, admission_number, current_grade_id, grades:current_grade_id(id, name)")
        .eq("admission_number", admissionNumberSearch.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFoundLearner(data);
        if (data.current_grade_id) {
          setSelectedRegGrade(data.current_grade_id);
        }
      } else {
        toast({
          title: "Not Found",
          description: "No learner found with that admission number",
          variant: "destructive",
        });
        setFoundLearner(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearchingLearner(false);
    }
  };

  const handleRegisterGradeLearningAreas = async () => {
    if (!selectedRegGrade || !selectedRegYear || selectedRegLearningAreas.length === 0) {
      toast({
        title: "Error",
        description: "Please select grade, academic year, and at least one learning area",
        variant: "destructive",
      });
      return;
    }

    await addGradeLearningAreas.mutateAsync({
      gradeId: selectedRegGrade,
      academicYear: selectedRegYear,
      learningAreaIds: selectedRegLearningAreas
    });

    setGradeRegDialogOpen(false);
    setSelectedRegGrade("");
    setSelectedRegYear("");
    setSelectedRegLearningAreas([]);
  };

  const handleRegisterLearnerLearningAreas = async () => {
    if (!foundLearner || !selectedRegGrade || !selectedRegYear || selectedRegLearningAreas.length === 0) {
      toast({
        title: "Error",
        description: "Please find a learner and select academic year and learning areas",
        variant: "destructive",
      });
      return;
    }

    await addLearnerLearningAreas.mutateAsync({
      learnerId: foundLearner.id,
      gradeId: selectedRegGrade,
      academicYear: selectedRegYear,
      learningAreaIds: selectedRegLearningAreas
    });

    setLearnerRegDialogOpen(false);
    setFoundLearner(null);
    setAdmissionNumberSearch("");
    setSelectedRegGrade("");
    setSelectedRegYear("");
    setSelectedRegLearningAreas([]);
  };

  const toggleLearningAreaSelection = (laId: string) => {
    setSelectedRegLearningAreas(prev => 
      prev.includes(laId) 
        ? prev.filter(id => id !== laId)
        : [...prev, laId]
    );
  };

  // Get already registered learning areas for the selected grade/year
  const getAlreadyRegisteredForGrade = () => {
    if (!selectedRegGrade || !selectedRegYear) return [];
    return gradeLearningAreas
      .filter(gla => gla.grade_id === selectedRegGrade && gla.academic_year === selectedRegYear)
      .map(gla => gla.learning_area_id);
  };

  // Get already registered learning areas for the found learner
  const getAlreadyRegisteredForLearner = () => {
    if (!foundLearner || !selectedRegYear) return [];
    return learnerLearningAreas
      .filter(lla => lla.learner_id === foundLearner.id && lla.academic_year === selectedRegYear)
      .map(lla => lla.learning_area_id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Academic Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure active academic year and term for fee calculations
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Active Academic Year */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    Active Academic Year
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Set the current academic year for all fee calculations
                  </CardDescription>
                </div>
                <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
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
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
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
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    Active Term
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Set the current term for fee assignments and payments
                  </CardDescription>
                </div>
                <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
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
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              {currentYear ? (
                <div className="space-y-3">
                  <Label className="text-xs sm:text-sm text-muted-foreground">
                    Terms for {currentYear.year}
                  </Label>
                  {academicPeriods
                    .filter(p => p.academic_year === currentYear?.year)
                    .sort((a, b) => a.term.localeCompare(b.term))
                    .map((period) => (
                      <div
                        key={period.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm sm:text-base">
                                {period.term.replace("_", " ").toUpperCase()}
                              </p>
                              {period.is_current && (
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <Label htmlFor={`term-${period.id}`} className="text-xs sm:text-sm text-muted-foreground">
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
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    Exam Types
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Manage exam types that will appear when adding learner marks
                  </CardDescription>
                </div>
                <Dialog open={examTypeDialogOpen} onOpenChange={setExamTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
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
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {examTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No exam types created yet. Click "New Exam Type" to add one.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table className="min-w-[600px] sm:min-w-0">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 px-3 text-xs font-medium">Name</TableHead>
                        <TableHead className="text-center py-2 px-3 text-xs font-medium">Max Marks</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-medium hidden md:table-cell">Description</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-medium">Status</TableHead>
                        <TableHead className="text-right py-2 px-3 text-xs font-medium">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examTypes.map((examType) => (
                      <TableRow key={examType.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium py-2 px-3 text-sm">
                          {editingExamType?.id === examType.id ? (
                            <Input
                              value={editingExamType.name}
                              onChange={(e) => setEditingExamType({ ...editingExamType, name: e.target.value })}
                              className="h-7 text-xs"
                            />
                          ) : (
                            examType.name
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2 px-3">
                          {editingExamType?.id === examType.id ? (
                            <Input
                              type="number"
                              value={editingExamType.max_marks}
                              onChange={(e) => setEditingExamType({ ...editingExamType, max_marks: parseInt(e.target.value) || 100 })}
                              className="h-7 w-14 text-xs"
                            />
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{examType.max_marks || 100}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2 px-3 text-sm">
                          {editingExamType?.id === examType.id ? (
                            <Input
                              value={editingExamType.description}
                              onChange={(e) => setEditingExamType({ ...editingExamType, description: e.target.value })}
                              className="h-7 text-xs"
                              placeholder="Description"
                            />
                          ) : (
                            <span className="text-muted-foreground">{examType.description || "-"}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={examType.is_active ?? true}
                              onCheckedChange={() => handleToggleExamTypeActive(examType.id, examType.is_active ?? true)}
                              className="scale-75"
                            />
                            <Badge variant={examType.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {examType.is_active ? "Active" : "Off"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2 px-3">
                          {editingExamType?.id === examType.id ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => setEditingExamType(null)} className="h-6 px-2 text-[10px]">
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleUpdateExamType} disabled={updateExamType.isPending} className="h-6 px-2 text-[10px]">
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                              onClick={() => setEditingExamType({
                                id: examType.id,
                                name: examType.name,
                                description: examType.description || "",
                                max_marks: examType.max_marks || 100
                              })}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteExamType(examType.id)}
                                disabled={deleteExamType.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grading System */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                    Grading System
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Configure the grading scale used for learner performance reports and transcripts
                  </CardDescription>
                </div>
                <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
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
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {gradingScales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No grading scales configured. Click "Add Grade" to create one.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table className="min-w-[500px] sm:min-w-0">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 px-3 text-xs font-medium">Grade</TableHead>
                        <TableHead className="text-center py-2 px-3 text-xs font-medium">Range (%)</TableHead>
                        <TableHead className="text-center py-2 px-3 text-xs font-medium">Points</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-medium hidden md:table-cell">Description</TableHead>
                        <TableHead className="text-right py-2 px-3 text-xs font-medium">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradingScales.map((scale) => (
                      <TableRow key={scale.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium py-2 px-3">
                          {editingGrade?.id === scale.id ? (
                            <Input
                              value={editingGrade.grade_name}
                              onChange={(e) => setEditingGrade({ ...editingGrade, grade_name: e.target.value })}
                              className="h-7 w-14 text-xs"
                            />
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{scale.grade_name}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2 px-3 text-sm">
                          {editingGrade?.id === scale.id ? (
                            <div className="flex items-center gap-1 justify-center">
                              <Input
                                type="number"
                                value={editingGrade.min_percentage}
                                onChange={(e) => setEditingGrade({ ...editingGrade, min_percentage: parseFloat(e.target.value) || 0 })}
                                className="h-7 w-10 text-xs"
                              />
                              <span className="text-[10px]">-</span>
                              <Input
                                type="number"
                                value={editingGrade.max_percentage}
                                onChange={(e) => setEditingGrade({ ...editingGrade, max_percentage: parseFloat(e.target.value) || 0 })}
                                className="h-7 w-10 text-xs"
                              />
                            </div>
                          ) : (
                            `${scale.min_percentage}-${scale.max_percentage}`
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2 px-3 text-sm">
                          {editingGrade?.id === scale.id ? (
                            <Input
                              type="number"
                              value={editingGrade.points}
                              onChange={(e) => setEditingGrade({ ...editingGrade, points: parseFloat(e.target.value) || 0 })}
                              className="h-7 w-10 text-xs"
                            />
                          ) : (
                            scale.points || "-"
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2 px-3 text-sm text-muted-foreground">
                          {editingGrade?.id === scale.id ? (
                            <Input
                              value={editingGrade.description}
                              onChange={(e) => setEditingGrade({ ...editingGrade, description: e.target.value })}
                              className="h-7 text-xs"
                              placeholder="Description"
                            />
                          ) : (
                            scale.description || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2 px-3">
                          {editingGrade?.id === scale.id ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => setEditingGrade(null)} className="h-6 px-2 text-[10px]">
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleUpdateGradingScale} disabled={updateGradingScale.isPending} className="h-6 px-2 text-[10px]">
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => setEditingGrade({
                                  id: scale.id,
                                  grade_name: scale.grade_name,
                                  min_percentage: scale.min_percentage,
                                  max_percentage: scale.max_percentage,
                                  points: scale.points || 0,
                                  description: scale.description || ""
                                })}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteGradingScale(scale.id)}
                                disabled={deleteGradingScale.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formula Settings */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                    Average Calculation Formula
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Define how the average is calculated across exam types (weighted or simple average)
                  </CardDescription>
                </div>
                <Dialog open={formulaDialogOpen} onOpenChange={setFormulaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      New Formula
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Calculation Formula</DialogTitle>
                      <DialogDescription>
                        Define a new formula for calculating average marks
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Formula Name *</Label>
                        <Input
                          placeholder="e.g., CBC Weighted Average"
                          value={newFormulaName}
                          onChange={(e) => setNewFormulaName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input
                          placeholder="Brief description of this formula"
                          value={newFormulaDescription}
                          onChange={(e) => setNewFormulaDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setFormulaDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (!newFormulaName.trim()) {
                            toast({ title: "Error", description: "Please enter a formula name", variant: "destructive" });
                            return;
                          }
                          await createFormula.mutateAsync({
                            name: newFormulaName.trim(),
                            description: newFormulaDescription.trim() || undefined,
                          });
                          setNewFormulaName("");
                          setNewFormulaDescription("");
                          setFormulaDialogOpen(false);
                        }}
                        disabled={createFormula.isPending}
                      >
                        Create Formula
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {formulas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No formulas created yet. Click "New Formula" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Active Formula Indicator */}
                  {activeFormula && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">Active: {activeFormula.name}</span>
                    </div>
                  )}
                  
                  {/* Formulas List */}
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table className="min-w-[500px] sm:min-w-0">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="py-2 px-3 text-xs font-medium">Name</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-medium hidden md:table-cell">Description</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-medium">Status</TableHead>
                          <TableHead className="text-right py-2 px-3 text-xs font-medium">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formulas.map((formula) => (
                          <TableRow key={formula.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium py-2 px-3 text-sm">{formula.name}</TableCell>
                            <TableCell className="hidden md:table-cell py-2 px-3 text-sm text-muted-foreground">
                              {formula.description || "-"}
                            </TableCell>
                            <TableCell className="py-2 px-3">
                              <Badge variant={formula.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                {formula.is_active ? "Active" : "Off"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right py-2 px-3">
                              <div className="flex justify-end gap-1">
                                {!formula.is_active && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => setActiveFormula.mutateAsync(formula.id)}
                                    disabled={setActiveFormula.isPending}
                                  >
                                    Set Active
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setSelectedFormula(formula.id);
                                    const weights = getFormulaWeights(formula.id);
                                    const weightMap: Record<string, number> = {};
                                    weights.forEach(w => {
                                      weightMap[w.exam_type_id] = w.weight;
                                    });
                                    setEditingWeights(weightMap);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this formula?")) {
                                      deleteFormula.mutateAsync(formula.id);
                                    }
                                  }}
                                  disabled={deleteFormula.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Weight Editor */}
                  {selectedFormula && (
                    <div className="border rounded-lg p-4 mt-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-sm">
                          Configure Exam Type Weights for: {formulas.find(f => f.id === selectedFormula)?.name}
                        </h4>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedFormula(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Set the weight (percentage contribution) for each exam type. Weights should sum to 100 for accurate calculation.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {examTypes.filter(et => et.is_active).map(examType => (
                          <div key={examType.id} className="flex items-center gap-2 bg-background p-2 rounded border">
                            <Label className="text-xs flex-1">{examType.name}</Label>
                            <Input
                              type="number"
                              className="w-20 h-8 text-xs"
                              placeholder="Weight %"
                              value={editingWeights[examType.id] || ""}
                              onChange={(e) => setEditingWeights(prev => ({
                                ...prev,
                                [examType.id]: parseFloat(e.target.value) || 0
                              }))}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-muted-foreground">
                          Total: {Object.values(editingWeights).reduce((sum, w) => sum + (w || 0), 0)}%
                        </p>
                        <Button
                          size="sm"
                          onClick={async () => {
                            for (const [examTypeId, weight] of Object.entries(editingWeights)) {
                              if (weight > 0) {
                                await saveFormulaWeight.mutateAsync({
                                  formulaId: selectedFormula,
                                  examTypeId,
                                  weight,
                                });
                              }
                            }
                            setSelectedFormula(null);
                            setEditingWeights({});
                          }}
                          disabled={saveFormulaWeight.isPending}
                        >
                          Save Weights
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Area Registration */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    Learning Area Registration
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Register learning areas for grades or individual learners per academic year
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Grade Registration Dialog */}
                  <Dialog open={gradeRegDialogOpen} onOpenChange={setGradeRegDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Register for Grade
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Register Learning Areas for Grade</DialogTitle>
                        <DialogDescription>
                          All learners in this grade will be expected to have marks for selected learning areas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Academic Year *</Label>
                            <Select value={selectedRegYear} onValueChange={setSelectedRegYear}>
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
                            <Label>Grade *</Label>
                            <Select value={selectedRegGrade} onValueChange={setSelectedRegGrade}>
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
                        </div>
                        <div className="space-y-2">
                          <Label>Select Learning Areas *</Label>
                          <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                            {learningAreas.map((la) => {
                              const alreadyRegistered = getAlreadyRegisteredForGrade().includes(la.id);
                              return (
                                <div key={la.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`grade-la-${la.id}`}
                                    checked={selectedRegLearningAreas.includes(la.id) || alreadyRegistered}
                                    onCheckedChange={() => !alreadyRegistered && toggleLearningAreaSelection(la.id)}
                                    disabled={alreadyRegistered}
                                  />
                                  <label 
                                    htmlFor={`grade-la-${la.id}`} 
                                    className={`text-sm cursor-pointer ${alreadyRegistered ? 'text-muted-foreground' : ''}`}
                                  >
                                    {la.name} ({la.code}) {alreadyRegistered && <Badge variant="secondary" className="ml-2 text-xs">Registered</Badge>}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Selected: {selectedRegLearningAreas.length} learning area(s)
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setGradeRegDialogOpen(false);
                          setSelectedRegLearningAreas([]);
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleRegisterGradeLearningAreas} disabled={addGradeLearningAreas.isPending}>
                          Register
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Learner Registration Dialog */}
                  <Dialog open={learnerRegDialogOpen} onOpenChange={setLearnerRegDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full sm:w-auto">
                        <User className="h-4 w-4 mr-2" />
                        Register for Learner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Register Learning Areas for Individual Learner</DialogTitle>
                        <DialogDescription>
                          Register specific learning areas for a learner (e.g., optional subjects)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Find Learner by Admission Number *</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter admission number"
                              value={admissionNumberSearch}
                              onChange={(e) => setAdmissionNumberSearch(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearchLearner()}
                            />
                            <Button onClick={handleSearchLearner} disabled={searchingLearner}>
                              {searchingLearner ? "Searching..." : "Search"}
                            </Button>
                          </div>
                        </div>

                        {foundLearner && (
                          <>
                            <div className="p-3 bg-muted/50 rounded-md">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{foundLearner.first_name} {foundLearner.last_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Adm: {foundLearner.admission_number} | Grade: {foundLearner.grades?.name || 'N/A'}
                                  </p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setFoundLearner(null);
                                  setAdmissionNumberSearch("");
                                }}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Academic Year *</Label>
                              <Select value={selectedRegYear} onValueChange={setSelectedRegYear}>
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
                              <Label>Select Learning Areas *</Label>
                              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                                {learningAreas.map((la) => {
                                  const alreadyRegistered = getAlreadyRegisteredForLearner().includes(la.id);
                                  return (
                                    <div key={la.id} className="flex items-center space-x-2">
                                      <Checkbox 
                                        id={`learner-la-${la.id}`}
                                        checked={selectedRegLearningAreas.includes(la.id) || alreadyRegistered}
                                        onCheckedChange={() => !alreadyRegistered && toggleLearningAreaSelection(la.id)}
                                        disabled={alreadyRegistered}
                                      />
                                      <label 
                                        htmlFor={`learner-la-${la.id}`} 
                                        className={`text-sm cursor-pointer ${alreadyRegistered ? 'text-muted-foreground' : ''}`}
                                      >
                                        {la.name} ({la.code}) {alreadyRegistered && <Badge variant="secondary" className="ml-2 text-xs">Registered</Badge>}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Selected: {selectedRegLearningAreas.length} learning area(s)
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setLearnerRegDialogOpen(false);
                          setFoundLearner(null);
                          setAdmissionNumberSearch("");
                          setSelectedRegLearningAreas([]);
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleRegisterLearnerLearningAreas} 
                          disabled={addLearnerLearningAreas.isPending || !foundLearner}
                        >
                          Register
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <Tabs defaultValue="grade" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="grade">Grade Registrations</TabsTrigger>
                  <TabsTrigger value="learner">Individual Registrations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="grade">
                  {gradeLearningAreas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No grade learning areas registered. Click "Register for Grade" to add.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Group by grade */}
                      {(() => {
                        // Group learning areas by grade
                        const groupedByGrade = gradeLearningAreas.reduce((acc: Record<string, typeof gradeLearningAreas>, gla) => {
                          const gradeKey = gla.grades?.name || 'Unknown';
                          if (!acc[gradeKey]) {
                            acc[gradeKey] = [];
                          }
                          acc[gradeKey].push(gla);
                          return acc;
                        }, {});

                        // Sort grades naturally
                        const sortedGrades = Object.keys(groupedByGrade).sort((a, b) => {
                          const numA = parseInt(a.replace(/\D/g, '')) || 0;
                          const numB = parseInt(b.replace(/\D/g, '')) || 0;
                          return numA - numB;
                        });

                        return sortedGrades.map(gradeName => (
                          <div key={gradeName} className="border rounded-lg overflow-hidden">
                            <div className="bg-primary/10 px-4 py-3 border-b">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                {gradeName}
                                <Badge variant="secondary" className="ml-2">
                                  {groupedByGrade[gradeName].length} subject(s)
                                </Badge>
                              </h4>
                            </div>
                            <div className="p-4">
                              <div className="flex flex-wrap gap-2">
                                {groupedByGrade[gradeName].map((gla) => (
                                  <div 
                                    key={gla.id} 
                                    className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg border"
                                  >
                                    <div>
                                      <span className="text-sm font-medium">{gla.learning_areas?.name}</span>
                                      <span className="text-xs text-muted-foreground ml-1">({gla.learning_areas?.code})</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {gla.academic_year}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                      onClick={() => {
                                        if (confirm("Remove this learning area from the grade?")) {
                                          removeGradeLearningArea.mutate(gla.id);
                                        }
                                      }}
                                      disabled={removeGradeLearningArea.isPending}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="learner">
                  {learnerLearningAreas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No individual learning areas registered. Click "Register for Learner" to add.
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <Table className="min-w-[600px] sm:min-w-0">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-sm">Learner</TableHead>
                            <TableHead className="text-sm">Adm No.</TableHead>
                            <TableHead className="text-sm">Learning Area</TableHead>
                            <TableHead className="text-sm">Year</TableHead>
                            <TableHead className="text-right text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {learnerLearningAreas.map((lla) => (
                            <TableRow key={lla.id}>
                              <TableCell className="text-sm">
                                {lla.learners?.first_name} {lla.learners?.last_name}
                              </TableCell>
                              <TableCell className="text-sm">
                                {lla.learners?.admission_number}
                              </TableCell>
                              <TableCell className="text-sm">
                                {lla.learning_areas?.name} ({lla.learning_areas?.code})
                              </TableCell>
                              <TableCell className="text-sm">
                                <Badge variant="outline">{lla.academic_year}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm("Remove this learning area from the learner?")) {
                                      removeLearnerLearningArea.mutate(lla.id);
                                    }
                                  }}
                                  disabled={removeLearnerLearningArea.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Current Academic Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-1 text-center sm:text-left p-3 bg-muted/50 rounded-lg sm:bg-transparent sm:p-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Academic Year</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{currentYear?.year || "Not Set"}</p>
              </div>
              <div className="space-y-1 text-center sm:text-left p-3 bg-muted/50 rounded-lg sm:bg-transparent sm:p-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Current Term</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  {currentPeriod?.term.replace("_", " ").toUpperCase() || "Not Set"}
                </p>
              </div>
              <div className="space-y-1 text-center sm:text-left p-3 bg-muted/50 rounded-lg sm:bg-transparent sm:p-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
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
