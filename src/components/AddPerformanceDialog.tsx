import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddPerformanceDialog = ({ open, onOpenChange }: AddPerformanceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Learner Performance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="learner">Learner *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select learner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">John Kamau - ADM001</SelectItem>
                  <SelectItem value="2">Mary Wanjiku - ADM002</SelectItem>
                  <SelectItem value="3">David Omondi - ADM003</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningArea">Learning Area *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select learning area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="kiswahili">Kiswahili</SelectItem>
                  <SelectItem value="science">Science & Technology</SelectItem>
                  <SelectItem value="social">Social Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examType">Exam Type *</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="midterm">Mid-Term Exam</SelectItem>
                <SelectItem value="endterm">End-Term Exam</SelectItem>
                <SelectItem value="cat">Continuous Assessment (CAT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paper1">Paper 1 Score</Label>
              <Input id="paper1" type="number" placeholder="0-100" min="0" max="100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paper2">Paper 2 Score</Label>
              <Input id="paper2" type="number" placeholder="0-100" min="0" max="100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paper3">Paper 3 Score</Label>
              <Input id="paper3" type="number" placeholder="0-100" min="0" max="100" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalScore">Total Score *</Label>
            <Input id="totalScore" type="number" placeholder="0-100" min="0" max="100" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Input id="grade" placeholder="e.g., A, B+, C" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Teacher Remarks</Label>
            <Input id="remarks" placeholder="Optional comments" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button>Save Performance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { AddPerformanceDialog };
