import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useGrades } from "@/hooks/useGrades";
import { Copy } from "lucide-react";

interface CloneTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClone: (params: {
    sourceAcademicYear: string;
    sourceTerm: string;
    targetAcademicYear: string;
    targetTerm: string;
    gradeId?: string;
  }) => void;
  isLoading?: boolean;
}

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export function CloneTimetableDialog({ open, onOpenChange, onClone, isLoading }: CloneTimetableDialogProps) {
  const { academicYears } = useAcademicYears();
  const { grades } = useGrades();

  const [formData, setFormData] = useState({
    sourceAcademicYear: '',
    sourceTerm: '',
    targetAcademicYear: '',
    targetTerm: '',
    gradeId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClone({
      sourceAcademicYear: formData.sourceAcademicYear,
      sourceTerm: formData.sourceTerm,
      targetAcademicYear: formData.targetAcademicYear,
      targetTerm: formData.targetTerm,
      gradeId: formData.gradeId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Copy className="h-5 w-5" />
            Clone Timetable
          </DialogTitle>
          <DialogDescription className="text-sm">
            Copy timetable entries from one term to another. You can optionally filter by grade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Source (Copy From)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Academic Year</Label>
                <Select
                  value={formData.sourceAcademicYear}
                  onValueChange={(value) => setFormData({ ...formData, sourceAcademicYear: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => (
                      <SelectItem key={year.id} value={year.year}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Term</Label>
                <Select
                  value={formData.sourceTerm}
                  onValueChange={(value) => setFormData({ ...formData, sourceTerm: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map(term => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Target (Copy To)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Academic Year</Label>
                <Select
                  value={formData.targetAcademicYear}
                  onValueChange={(value) => setFormData({ ...formData, targetAcademicYear: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => (
                      <SelectItem key={year.id} value={year.year}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Term</Label>
                <Select
                  value={formData.targetTerm}
                  onValueChange={(value) => setFormData({ ...formData, targetTerm: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map(term => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Grade (Optional - leave empty to clone all)</Label>
            <Select
              value={formData.gradeId}
              onValueChange={(value) => setFormData({ ...formData, gradeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Grades</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.sourceAcademicYear || !formData.sourceTerm || !formData.targetAcademicYear || !formData.targetTerm}
            >
              {isLoading ? 'Cloning...' : 'Clone Timetable'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
