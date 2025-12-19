import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useExamTypes } from "@/hooks/useExamTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";

interface OutletContext {
  teacher: any;
}

export default function TeacherMarks() {
  const { toast } = useToast();
  const { teacher } = useOutletContext<OutletContext>();
  const { grades } = useGrades();
  const { currentPeriod } = useAcademicPeriods();
  const { academicYears, currentYear } = useAcademicYears();
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
  const [teacherLearningAreas, setTeacherLearningAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  
  const { streams } = useStreams(selectedGradeId);

  // Fetch learning areas assigned to this teacher
  useEffect(() => {
    if (teacher?.id) {
      fetchTeacherLearningAreas();
    }
  }, [teacher?.id]);

  const fetchTeacherLearningAreas = async () => {
    if (!teacher?.id) return;
    
    setLoadingAreas(true);
    try {
      const { data, error } = await supabase
        .from("learning_areas")
        .select("*")
        .eq("teacher_id", teacher.id)
        .order("name");

      if (error) throw error;
      setTeacherLearningAreas(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your assigned learning areas",
        variant: "destructive",
      });
    } finally {
      setLoadingAreas(false);
    }
  };

  // Set default academic year and term
  useEffect(() => {
    if (currentPeriod) {
      setSelectedAcademicYear(currentPeriod.academic_year);
      setSelectedTerm(currentPeriod.term);
    } else if (currentYear) {
      setSelectedAcademicYear(currentYear.year);
    }
  }, [currentPeriod, currentYear]);

  useEffect(() => {
    if (selectedGradeId && selectedStreamId && selectedLearningAreaId && selectedAcademicYear && selectedTerm && selectedExamType) {
      fetchLearners();
    } else if (selectedGradeId && selectedStreamId) {
      fetchLearnersOnly();
    } else {
      setLearners([]);
      setScores({});
    }
  }, [selectedGradeId, selectedStreamId, selectedLearningAreaId, selectedAcademicYear, selectedTerm, selectedExamType]);

  // Helper to get session token
  const getTeacherSessionToken = () => {
    return localStorage.getItem("teacher_session");
  };

  const fetchLearnersOnly = async () => {
    setLoading(true);
    try {
      const sessionToken = getTeacherSessionToken();
      if (!sessionToken) {
        toast({
          title: "Session Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      // Use the secure RPC function that bypasses RLS
      const { data, error } = await supabase.rpc("get_active_learners_for_teacher_session", {
        p_session_token: sessionToken,
        p_grade_id: selectedGradeId,
        p_stream_id: selectedStreamId,
      });

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
      const sessionToken = getTeacherSessionToken();
      if (!sessionToken) {
        toast({
          title: "Session Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      // Use the secure RPC function that bypasses RLS
      const { data, error } = await supabase.rpc("get_active_learners_for_teacher_session", {
        p_session_token: sessionToken,
        p_grade_id: selectedGradeId,
        p_stream_id: selectedStreamId,
      });

      if (error) throw error;
      setLearners(data || []);

      // Fetch existing performance records for these learners
      if (data && data.length > 0) {
        const learnerIds = data.map((l: any) => l.id);
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
    if (marks >= 80) return "E.E"; // Exceeding Expectation
    if (marks >= 50) return "M.E"; // Meeting Expectation
    if (marks >= 30) return "A.E"; // Approaching Expectation
    return "B.E"; // Below Expectation
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
          teacher_id: teacher?.id,
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
      // Refresh to show updated scores
      fetchLearners();
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
    learner.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get max marks for selected exam type
  const selectedExamTypeObj = examTypes.find(e => e.name === selectedExamType);
  const maxMarks = selectedExamTypeObj?.max_marks || 100;

  if (loadingAreas) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Performance Marks</h1>
        <p className="text-muted-foreground">
          Enter and manage learner performance records for your assigned learning areas
        </p>
      </div>

      {teacherLearningAreas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>You don't have any learning areas assigned to you yet.</p>
            <p className="text-sm mt-2">Please contact the administrator to assign learning areas.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Marks Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    {teacherLearningAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name} ({area.code})
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
                    placeholder="Search by admission number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Learners Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Adm No.</TableHead>
                        <TableHead className="w-32">Score (0-{maxMarks})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredLearners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No learners found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLearners.map((learner, index) => (
                          <TableRow key={learner.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{learner.admission_number}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={maxMarks}
                                value={scores[learner.id] || ""}
                                onChange={(e) => handleScoreChange(learner.id, e.target.value)}
                                placeholder={`0-${maxMarks}`}
                                className="w-24"
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
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit All Scores
                  </Button>
                </div>
              </>
            )}

            {!loading && learners.length === 0 && selectedGradeId && selectedStreamId && (
              <div className="text-center py-8 text-muted-foreground">
                No active learners found in this grade and stream
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
