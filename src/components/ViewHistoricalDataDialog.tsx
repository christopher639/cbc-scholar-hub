import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, GraduationCap } from "lucide-react";

interface ViewHistoricalDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerName?: string;
  onPeriodSelect: (academicYear: string, term: string) => void;
}

export function ViewHistoricalDataDialog({ 
  open, 
  onOpenChange, 
  learnerName,
  onPeriodSelect 
}: ViewHistoricalDataDialogProps) {
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [term, setTerm] = useState("Term 3");

  const academicYears = ["2024-2025", "2023-2024", "2022-2023", "2021-2022"];
  const terms = ["Term 1", "Term 2", "Term 3"];

  // Mock historical data
  const historicalData = {
    "2024-2025": {
      "Term 3": { grade: "Grade 4", stream: "Green", hasData: true },
      "Term 2": { grade: "Grade 4", stream: "Green", hasData: true },
      "Term 1": { grade: "Grade 4", stream: "Green", hasData: true },
    },
    "2023-2024": {
      "Term 3": { grade: "Grade 3", stream: "Blue", hasData: true },
      "Term 2": { grade: "Grade 3", stream: "Blue", hasData: true },
      "Term 1": { grade: "Grade 3", stream: "Blue", hasData: true },
    },
  };

  const selectedPeriodData = historicalData[academicYear as keyof typeof historicalData]?.[term as keyof typeof historicalData["2024-2025"]];

  const handleViewData = () => {
    onPeriodSelect(academicYear, term);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>View Historical Data</DialogTitle>
          <DialogDescription>
            {learnerName ? `Select a reporting period to view data for ${learnerName}` : "Select a reporting period to view learner data"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger id="academicYear">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger id="term">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPeriodData && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                Data Preview: {academicYear} - {term}
              </div>
              
              {selectedPeriodData.hasData ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Grade Level:</span>
                    <Badge variant="secondary">{selectedPeriodData.grade}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stream:</span>
                    <Badge variant="secondary">{selectedPeriodData.stream}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-success text-sm">
                    <GraduationCap className="h-4 w-4" />
                    Performance data available
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No data available for this period
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleViewData}
            disabled={!selectedPeriodData?.hasData}
          >
            View Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
