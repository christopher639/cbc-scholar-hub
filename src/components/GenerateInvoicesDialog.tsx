import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { Loader2 } from "lucide-react";

interface GenerateInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (academicYear: string, term: "term_1" | "term_2" | "term_3", gradeId?: string, streamId?: string) => Promise<any>;
}

export function GenerateInvoicesDialog({
  open,
  onOpenChange,
  onGenerate,
}: GenerateInvoicesDialogProps) {
  const [academicYear, setAcademicYear] = useState("");
  const [term, setTerm] = useState("");
  const [gradeId, setGradeId] = useState<string | undefined>(undefined);
  const [streamId, setStreamId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const { academicYears } = useAcademicYears();
  const { grades } = useGrades();
  const { streams } = useStreams();

  // Filter streams by selected grade
  const filteredStreams = gradeId && gradeId !== "all" 
    ? streams.filter(s => s.grade_id === gradeId)
    : [];

  // Reset stream when grade changes
  useEffect(() => {
    setStreamId(undefined);
  }, [gradeId]);

  const handleGenerate = async () => {
    if (!academicYear || !term) return;

    setLoading(true);
    try {
      await onGenerate(academicYear, term as "term_1" | "term_2" | "term_3", gradeId, streamId);
      onOpenChange(false);
      setAcademicYear("");
      setTerm("");
      setGradeId(undefined);
      setStreamId(undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Generate Invoices</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
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
            <Label>Term</Label>
            <Select value={term} onValueChange={setTerm}>
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
            <Label>Grade (Optional - Leave empty for all grades)</Label>
            <Select value={gradeId} onValueChange={(value) => setGradeId(value === "all" ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {gradeId && gradeId !== "all" && filteredStreams.length > 0 && (
            <div className="space-y-2">
              <Label>Stream (Optional - Leave empty for all streams in grade)</Label>
              <Select value={streamId} onValueChange={(value) => setStreamId(value === "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All streams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All streams</SelectItem>
                  {filteredStreams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading || !academicYear || !term}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Invoices
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
