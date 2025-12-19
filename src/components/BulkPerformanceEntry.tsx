import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useExamTypes } from "@/hooks/useExamTypes";
import { useLearningAreaRegistration } from "@/hooks/useLearningAreaRegistration";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkPerformanceEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkPerformanceEntry({ open, onOpenChange }: BulkPerformanceEntryProps) {
  const { toast } = useToast();
  const { grades } = useGrades();
  const { currentPeriod } = useAcademicPeriods();
  const { academicYears, currentYear } = useAcademicYears();
  const { learningAreas } = useLearningAreas();
  const { gradeLearningAreas, learnerLearningAreas } = useLearningAreaRegistration();
  const { examTypes } = useExamTypes();
  
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedLearningAreaId, setSelectedLearningAreaId] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [learners, setLearners] = useState<any[]>([]);
  const [scores, setScores] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { streams } = useStreams(selectedGradeId);

  // Set default academic year and term when dialog opens
  useEffect(() => {
    if (open && currentPeriod) {
      setSelectedAcademicYear(currentPeriod.academic_year);
      setSelectedTerm(currentPeriod.term);
    } else if (open && currentYear) {
      setSelectedAcademicYear(currentYear.year);
    }
  }, [open, currentPeriod, currentYear]);

  useEffect(() => {
    if (selectedGradeId && selectedStreamId && selectedLearningAreaId && selectedAcademicYear && selectedTerm && selectedExamType) {
      fetchLearners();
    } else if (selectedGradeId && selectedStreamId) {
      // Fetch learners without existing marks if all filters not set
      fetchLearnersOnly();
    } else {
      setLearners([]);
      setScores({});
    }
  }, [selectedGradeId, selectedStreamId, selectedLearningAreaId, selectedAcademicYear, selectedTerm, selectedExamType]);

  // Get learners registered for the selected learning area (grade-level or individual)
  const getRegisteredLearnerIds = (): Set<string> => {
    const registeredIds = new Set<string>();
    
    // Check grade-level registrations
    const gradeRegistration = gradeLearningAreas.find(
      gla => gla.grade_id === selectedGradeId && 
             gla.learning_area_id === selectedLearningAreaId && 
             gla.academic_year === selectedAcademicYear
    );
    
    if (gradeRegistration) {
      // If learning area is registered for the whole grade, all learners in that grade are registered
      return new Set(['ALL_GRADE_LEARNERS']);
    }
    
    // Check individual learner registrations
    learnerLearningAreas.forEach(lla => {
      if (lla.learning_area_id === selectedLearningAreaId && 
          lla.grade_id === selectedGradeId && 
          lla.academic_year === selectedAcademicYear) {
        registeredIds.add(lla.learner_id);
      }
    });
    
    return registeredIds;
  };

  const fetchLearnersOnly = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("learners")
        .select("id, admission_number, first_name, last_name")
        .eq("current_grade_id", selectedGradeId)
        .eq("current_stream_id", selectedStreamId)
        .eq("status", "active")
        .order("admission_number", { ascending: true });

      if (error) throw error;
      setLearners(data || []);
      setScores({});
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

  const fetchLearners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("learners")
        .select("id, admission_number, first_name, last_name")
        .eq("current_grade_id", selectedGradeId)
        .eq("current_stream_id", selectedStreamId)
        .eq("status", "active")
        .order("admission_number", { ascending: true });

      if (error) throw error;
      
      // Filter learners based on learning area registration
      const registeredIds = getRegisteredLearnerIds();
      let filteredData = data || [];
      
      if (!registeredIds.has('ALL_GRADE_LEARNERS') && registeredIds.size > 0) {
        // Only show individually registered learners
        filteredData = (data || []).filter(l => registeredIds.has(l.id));
      } else if (!registeredIds.has('ALL_GRADE_LEARNERS') && registeredIds.size === 0) {
        // No registrations found for this learning area
        filteredData = [];
      }
      // If 'ALL_GRADE_LEARNERS' is in set, show all learners (grade-level registration)
      
      setLearners(filteredData);

      // Fetch existing performance records for these learners
      if (filteredData && filteredData.length > 0) {
        const learnerIds = filteredData.map(l => l.id);
        const { data: existingRecords } = await supabase
          .from("performance_records")
          .select("learner_id, marks")
          .in("learner_id", learnerIds)
          .eq("learning_area_id", selectedLearningAreaId)
          .eq("academic_year", selectedAcademicYear)
          .eq("term", selectedTerm as "term_1" | "term_2" | "term_3")
          .eq("exam_type", selectedExamType);

        // Pre-populate scores with existing marks
        if (existingRecords && existingRecords.length > 0) {
          const existingScores: Record<string, string> = {};
          existingRecords.forEach(record => {
            existingScores[record.learner_id] = record.marks.toString();
          });
          setScores(existingScores);
        } else {
          setScores({});
        }
      } else {
        setScores({});
      }
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

  const handleScoreChange = (learnerId: string, value: string) => {
    setScores(prev => ({
      ...prev,
      [learnerId]: value
    }));
  };

  const calculateGradeLetter = (marks: number) => {
    if (marks >= 76) return "E.E"; // Exceeding Expectation
    if (marks >= 51) return "M.E"; // Meeting Expectation
    if (marks >= 26) return "B.E"; // Below Expectation
    return "D.E"; // Developing Expectation
  };

  const handleSubmit = async () => {
    if (!selectedLearningAreaId || !selectedExamType || !selectedAcademicYear) {
      toast({
        title: "Error",
        description: "Please select learning area, academic year, and exam type",
        variant: "destructive",
      });
      return;
    }

    const validScores = Object.entries(scores).filter(([_, value]) => value !== "");
    
    if (validScores.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one score",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const user = await supabase.auth.getUser();
      
      const performanceRecords = validScores.map(([learnerId, marks]) => {
        const numericMarks = Number(marks);
        return {
          learner_id: learnerId,
          grade_id: selectedGradeId,
          stream_id: selectedStreamId,
          learning_area_id: selectedLearningAreaId,
          marks: numericMarks,
          grade_letter: calculateGradeLetter(numericMarks),
          exam_type: selectedExamType,
          academic_year: selectedAcademicYear,
          term: (selectedTerm as any) || null,
          academic_period_id: currentPeriod?.id,
        };
      });

      // Use upsert to update existing records or insert new ones
      const { error } = await supabase
        .from("performance_records")
        .upsert(performanceRecords, {
          onConflict: "learner_id,learning_area_id,academic_year,term,exam_type,grade_id",
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${validScores.length} performance records submitted successfully`,
      });

      setScores({});
      onOpenChange(false);
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

  const filteredLearners = learners.filter(learner =>
    learner.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${learner.first_name} ${learner.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Performance Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Academic Year *</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Academic Year" />
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

            <div>
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term_1">Term 1</SelectItem>
                  <SelectItem value="term_2">Term 2</SelectItem>
                  <SelectItem value="term_3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Grade *</Label>
              <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
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

            <div>
              <Label>Stream *</Label>
              <Select 
                value={selectedStreamId} 
                onValueChange={setSelectedStreamId}
                disabled={!selectedGradeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Stream" />
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

            <div>
              <Label>Learning Area *</Label>
              <Select value={selectedLearningAreaId} onValueChange={setSelectedLearningAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Learning Area" />
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

            <div>
              <Label>Exam Type *</Label>
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.filter(e => e.is_active).map((examType) => (
                    <SelectItem key={examType.id} value={examType.name}>
                      {examType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {learners.length > 0 && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admission number or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Learners Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-32">Score (0-100)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredLearners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No learners found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLearners.map((learner, index) => (
                        <TableRow key={learner.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{learner.admission_number}</TableCell>
                          <TableCell>{`${learner.first_name} ${learner.last_name}`}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={scores[learner.id] || ""}
                              onChange={(e) => handleScoreChange(learner.id, e.target.value)}
                              placeholder="0-100"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit All Scores
                </Button>
              </div>
            </>
          )}

          {!loading && learners.length === 0 && selectedGradeId && selectedStreamId && selectedLearningAreaId && selectedAcademicYear && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No learners are registered for this learning area in the selected grade and academic year. 
                Please register learners for this learning area in Academic Settings first.
              </AlertDescription>
            </Alert>
          )}
          
          {!loading && learners.length === 0 && selectedGradeId && selectedStreamId && !selectedLearningAreaId && (
            <div className="text-center py-8 text-muted-foreground">
              Please select a learning area to load registered learners
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
