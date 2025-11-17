import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface PromoteLearnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLearners: string[];
  currentGrade: string;
}

export function PromoteLearnerDialog({ open, onOpenChange, selectedLearners, currentGrade }: PromoteLearnerDialogProps) {
  const { toast } = useToast();
  const [targetGrade, setTargetGrade] = useState("");
  const [targetStream, setTargetStream] = useState("");
  const [checkFeeBalance, setCheckFeeBalance] = useState(true);

  const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
  const streams = ["Red", "Blue", "Green", "Yellow"];

  const handlePromote = () => {
    if (!targetGrade || !targetStream) {
      toast({
        title: "Error",
        description: "Please select both grade and stream",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Learners Promoted",
      description: `${selectedLearners.length} learner(s) promoted to ${targetGrade} ${targetStream}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Promote Learners</DialogTitle>
          <DialogDescription>
            Promote {selectedLearners.length} learner(s) from {currentGrade} to the next grade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetGrade">Target Grade</Label>
            <Select value={targetGrade} onValueChange={setTargetGrade}>
              <SelectTrigger id="targetGrade">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetStream">Target Stream</Label>
            <Select value={targetStream} onValueChange={setTargetStream}>
              <SelectTrigger id="targetStream">
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>
              <SelectContent>
                {streams.map((stream) => (
                  <SelectItem key={stream} value={stream}>
                    {stream} Stream
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="checkFees" 
              checked={checkFeeBalance}
              onCheckedChange={(checked) => setCheckFeeBalance(checked as boolean)}
            />
            <Label htmlFor="checkFees" className="text-sm font-normal">
              Block promotion for learners with outstanding fee balances
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePromote}>Promote Learners</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
