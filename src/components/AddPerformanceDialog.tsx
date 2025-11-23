import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useLearningAreas } from "@/hooks/useLearningAreas";
import { z } from "zod";

const performanceSchema = z.object({
  admissionNumber: z.string().trim().min(1, "Admission number is required"),
  learningAreaCode: z.string().trim().min(1, "Learning area is required"),
  marks: z.string().trim().min(1, "Marks are required"),
  gradeId: z.string().min(1, "Grade is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  term: z.string().optional(),
  examType: z.string().optional(),
  remarks: z.string().max(500, "Remarks must be less than 500 characters").optional(),
});

interface AddPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddPerformanceDialog = ({ open, onOpenChange }: AddPerformanceDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { learningAreas } = useLearningAreas();
  const [grades, setGrades] = useState<any[]>([]);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const { academicYears, currentYear } = useAcademicYears();
  const { currentPeriod } = useAcademicPeriods();
  
  const [formData, setFormData] = useState({
    admissionNumber: "",
    learningAreaCode: "",
    marks: "",
    gradeId: "",
    academicYear: "",
    term: "",
    examType: "",
    remarks: "",
  });

  useEffect(() => {
    if (open && currentPeriod) {
      setFormData(prev => ({ 
        ...prev, 
        academicYear: currentPeriod.academic_year,
        term: currentPeriod.term 
      }));
    } else if (open && currentYear) {
      setFormData(prev => ({ ...prev, academicYear: currentYear.year }));
    }
  }, [open, currentPeriod, currentYear]);

  useEffect(() => {
    if (open) {
      fetchGrades();
    }
  }, [open]);
  const fetchGrades = async () => {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .order("grade_level", { ascending: true });
    
    if (!error && data) {
      setGrades(data);
    }
  };

  // Check for existing performance record when filters change
  useEffect(() => {
    const checkExistingPerformance = async () => {
      if (!formData.admissionNumber || !formData.learningAreaCode || 
          !formData.academicYear || !formData.gradeId) {
        setExistingRecordId(null);
        return;
      }

      try {
        setCheckingExisting(true);

        // Find learner
        const { data: learner, error: learnerError } = await supabase
          .from("learners")
          .select("id")
          .eq("admission_number", formData.admissionNumber)
          .maybeSingle();

        if (learnerError || !learner) {
          setExistingRecordId(null);
          return;
        }

        // Find learning area
        const { data: learningArea, error: areaError } = await supabase
          .from("learning_areas")
          .select("id")
          .eq("code", formData.learningAreaCode.toUpperCase())
          .maybeSingle();

        if (areaError || !learningArea) {
          setExistingRecordId(null);
          return;
        }

        // Check for existing record
        let query = supabase
          .from("performance_records")
          .select("*")
          .eq("learner_id", learner.id)
          .eq("learning_area_id", learningArea.id)
          .eq("academic_year", formData.academicYear)
          .eq("grade_id", formData.gradeId);

        if (formData.term) {
          query = query.eq("term", formData.term as any);
        }
        if (formData.examType) {
          query = query.eq("exam_type", formData.examType);
        }

        const { data: existingRecord, error: recordError } = await query.maybeSingle();

        if (!recordError && existingRecord) {
          // Pre-populate form with existing data
          setFormData(prev => ({
            ...prev,
            marks: existingRecord.marks.toString(),
            remarks: existingRecord.remarks || "",
            term: existingRecord.term || "",
            examType: existingRecord.exam_type || "",
          }));
          setExistingRecordId(existingRecord.id);
          
          toast({
            title: "Existing Record Found",
            description: "This learner already has a performance record for these criteria. You can update it.",
          });
        } else {
          setExistingRecordId(null);
        }
      } catch (error) {
        console.error("Error checking existing performance:", error);
      } finally {
        setCheckingExisting(false);
      }
    };

    const debounceTimer = setTimeout(checkExistingPerformance, 500);
    return () => clearTimeout(debounceTimer);
  }, [
    formData.admissionNumber,
    formData.learningAreaCode,
    formData.academicYear,
    formData.term,
    formData.examType,
    formData.gradeId,
  ]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate input
      const validation = performanceSchema.safeParse(formData);
      if (!validation.success) {
        const errorMessage = validation.error.errors[0]?.message || "Invalid input";
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Validate marks range
      const marksValue = parseFloat(formData.marks);
      if (marksValue < 0 || marksValue > 100) {
        toast({
          title: "Invalid Marks",
          description: "Marks must be between 0 and 100",
          variant: "destructive",
        });
        return;
      }

      // Find learner by admission number
      const { data: learner, error: learnerError } = await supabase
        .from("learners")
        .select("id")
        .eq("admission_number", formData.admissionNumber.trim())
        .maybeSingle();

      if (learnerError || !learner) {
        toast({
          title: "Error",
          description: "Learner not found with this admission number",
          variant: "destructive",
        });
        return;
      }

      // Find learning area by code
      const { data: learningArea, error: areaError } = await supabase
        .from("learning_areas")
        .select("id")
        .eq("code", formData.learningAreaCode.toUpperCase())
        .maybeSingle();

      if (areaError || !learningArea) {
        toast({
          title: "Error",
          description: "Learning area not found with this code",
          variant: "destructive",
        });
        return;
      }

      const performanceData = {
        learner_id: learner.id,
        learning_area_id: learningArea.id,
        academic_year: formData.academicYear,
        term: formData.term as any || null,
        exam_type: formData.examType || null,
        grade_id: formData.gradeId,
        marks: marksValue,
        remarks: formData.remarks?.trim() || null,
      };

      if (existingRecordId) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("performance_records")
          .update(performanceData)
          .eq("id", existingRecordId);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Performance record updated successfully",
        });
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("performance_records")
          .insert([performanceData]);

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Performance record added successfully",
        });
      }

      // Reset form
      setFormData({
        admissionNumber: "",
        learningAreaCode: "",
        marks: "",
        gradeId: "",
        academicYear: currentYear?.year || "",
        term: "",
        examType: "",
        remarks: "",
      });
      setExistingRecordId(null);
      
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Record Learner Performance
            {existingRecordId && (
              <Badge variant="secondary">Updating Existing Record</Badge>
            )}
            {checkingExisting && (
              <Badge variant="outline">Checking...</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission Number *</Label>
              <Input
                id="admissionNumber"
                placeholder="e.g., 2500001"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enter learner's admission number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningAreaCode">Learning Area Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="learningAreaCode"
                  placeholder="e.g., MATH"
                  className="uppercase font-mono"
                  maxLength={10}
                  value={formData.learningAreaCode}
                  onChange={(e) => setFormData({ ...formData, learningAreaCode: e.target.value.toUpperCase() })}
                />
                <Select 
                  value={formData.learningAreaCode}
                  onValueChange={(value) => setFormData({ ...formData, learningAreaCode: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Or select" />
                  </SelectTrigger>
                  <SelectContent>
                    {learningAreas.map((area) => (
                      <SelectItem key={area.id} value={area.code}>
                        {area.code} - {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter or select learning area code
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Select
                value={formData.academicYear}
                onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
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
              <Label htmlFor="grade">Grade Level *</Label>
              <Select
                value={formData.gradeId}
                onValueChange={(value) => setFormData({ ...formData, gradeId: value })}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select
                value={formData.term}
                onValueChange={(value) => setFormData({ ...formData, term: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term_1">Term 1</SelectItem>
                  <SelectItem value="term_2">Term 2</SelectItem>
                  <SelectItem value="term_3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examType">Exam Type</Label>
              <Select
                value={formData.examType}
                onValueChange={(value) => setFormData({ ...formData, examType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opener">Opener</SelectItem>
                  <SelectItem value="midterm">Mid-Term</SelectItem>
                  <SelectItem value="endterm">End-Term</SelectItem>
                  <SelectItem value="mock">Mock Exam</SelectItem>
                  <SelectItem value="final">Final Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marks">Marks / Score *</Label>
            <Input
              id="marks"
              type="number"
              placeholder="Enter marks (e.g., 85)"
              min="0"
              max="100"
              value={formData.marks}
              onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Add any comments about the learner's performance..."
              className="min-h-[80px]"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || checkingExisting}>
            {loading ? "Saving..." : existingRecordId ? "Update Performance" : "Save Performance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPerformanceDialog;
