import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudyScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: () => void;
  loading: boolean;
  preferences: {
    weekdayHours: number;
    weekendHours: number;
    sessionLength: number;
  };
  onPreferencesChange: (preferences: any) => void;
  assessments: Array<{ subject: string; date: string; type: string }>;
  onAssessmentsChange: (assessments: any[]) => void;
  availableSubjects: string[];
}

export function StudyScheduleDialog({
  open,
  onOpenChange,
  onGenerate,
  loading,
  preferences,
  onPreferencesChange,
  assessments,
  onAssessmentsChange,
  availableSubjects,
}: StudyScheduleDialogProps) {
  const addAssessment = () => {
    onAssessmentsChange([
      ...assessments,
      { subject: "", date: "", type: "Test" },
    ]);
  };

  const removeAssessment = (index: number) => {
    onAssessmentsChange(assessments.filter((_, i) => i !== index));
  };

  const updateAssessment = (index: number, field: string, value: string) => {
    const updated = [...assessments];
    updated[index] = { ...updated[index], [field]: value };
    onAssessmentsChange(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Generate Study Schedule
          </DialogTitle>
          <DialogDescription>
            Customize your study preferences and upcoming assessments to get a personalized weekly timetable
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Study Time Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Study Time
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="weekday-hours" className="text-xs">Weekday Hours/Day</Label>
                <Input
                  id="weekday-hours"
                  type="number"
                  min="1"
                  max="8"
                  value={preferences.weekdayHours}
                  onChange={(e) => onPreferencesChange({ ...preferences, weekdayHours: parseInt(e.target.value) || 2 })}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weekend-hours" className="text-xs">Weekend Hours/Day</Label>
                <Input
                  id="weekend-hours"
                  type="number"
                  min="1"
                  max="12"
                  value={preferences.weekendHours}
                  onChange={(e) => onPreferencesChange({ ...preferences, weekendHours: parseInt(e.target.value) || 4 })}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-length" className="text-xs">Session Length (min)</Label>
                <Select
                  value={preferences.sessionLength.toString()}
                  onValueChange={(value) => onPreferencesChange({ ...preferences, sessionLength: parseInt(value) })}
                >
                  <SelectTrigger id="session-length" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Upcoming Assessments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Assessments (Optional)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAssessment}
                className="gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {assessments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  No assessments added. Click "Add" to include upcoming tests or exams.
                </p>
              ) : (
                assessments.map((assessment, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid gap-2 sm:grid-cols-3">
                      <Select
                        value={assessment.subject}
                        onValueChange={(value) => updateAssessment(index, "subject", value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="date"
                        value={assessment.date}
                        onChange={(e) => updateAssessment(index, "date", e.target.value)}
                        className="text-sm"
                      />
                      
                      <Select
                        value={assessment.type}
                        onValueChange={(value) => updateAssessment(index, "type", value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Test">Test</SelectItem>
                          <SelectItem value="Exam">Exam</SelectItem>
                          <SelectItem value="Quiz">Quiz</SelectItem>
                          <SelectItem value="Assignment">Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssessment(index)}
                      className="h-9 w-9 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={onGenerate} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Generate Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
