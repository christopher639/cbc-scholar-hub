import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";

interface AddPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddPerformanceDialog = ({ open, onOpenChange }: AddPerformanceDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [learningAreas, setLearningAreas] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const { currentPeriod } = useAcademicPeriods();
  
  const [formData, setFormData] = useState({
    admissionNumber: "",
    learningAreaCode: "",
    marks: "",
    gradeId: "",
    term: "",
    remarks: "",
  });

  useEffect(() => {
    if (open && currentPeriod) {
      setFormData(prev => ({ ...prev, term: currentPeriod.term }));
    }
  }, [open, currentPeriod]);

  useEffect(() => {
    if (open) {
      fetchLearningAreas();
      fetchGrades();
    }
  }, [open]);

  const fetchLearningAreas = async () => {
    const { data, error } = await supabase
      .from("learning_areas")
      .select("*")
      .order("name", { ascending: true });
    
    if (!error && data) {
      setLearningAreas(data);
    }
  };


  const fetchGrades = async () => {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .order("grade_level", { ascending: true });
    
    if (!error && data) {
      setGrades(data);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Find learner by admission number
      const { data: learner, error: learnerError } = await supabase
        .from("learners")
        .select("id")
        .eq("admission_number", formData.admissionNumber)
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

      if (!currentPeriod) {
        toast({
          title: "Error",
          description: "No current academic period found",
          variant: "destructive",
        });
        return;
      }

      // Insert performance record
      const { error: insertError } = await supabase
        .from("performance_records")
        .insert({
          learner_id: learner.id,
          learning_area_id: learningArea.id,
          academic_period_id: currentPeriod.id,
          grade_id: formData.gradeId,
          marks: parseFloat(formData.marks),
          remarks: formData.remarks || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Performance record added successfully",
      });

      // Reset form
      setFormData({
        admissionNumber: "",
        learningAreaCode: "",
        marks: "",
        gradeId: "",
        term: currentPeriod?.term || "",
        remarks: "",
      });
      
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
          <DialogTitle>Record Learner Performance</DialogTitle>
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
              <Label htmlFor="term">Term *</Label>
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
              {currentPeriod && (
                <p className="text-xs text-muted-foreground">
                  Academic Year: {currentPeriod.academic_year}
                </p>
              )}
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Performance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPerformanceDialog;
