import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { usePromoteLearners } from "@/hooks/usePromoteLearners";

interface PromoteLearnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLearners: string[];
  currentGrade: string;
  onSuccess?: () => void;
}

export function PromoteLearnerDialog({ 
  open, 
  onOpenChange, 
  selectedLearners, 
  currentGrade,
  onSuccess 
}: PromoteLearnerDialogProps) {
  const { toast } = useToast();
  const { grades } = useGrades();
  const [targetGrade, setTargetGrade] = useState("");
  const { streams } = useStreams(targetGrade);
  const [targetStream, setTargetStream] = useState("");
  const [checkFeeBalance, setCheckFeeBalance] = useState(true);
  const { promoteLearners } = usePromoteLearners();
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = async () => {
    if (!targetGrade || !targetStream) {
      toast({
        title: "Error",
        description: "Please select both grade and stream",
        variant: "destructive",
      });
      return;
    }

    setIsPromoting(true);
    const academicYear = new Date().getFullYear().toString();
    
    const result = await promoteLearners(
      selectedLearners,
      targetGrade,
      targetStream,
      academicYear
    );

    setIsPromoting(false);

    if (result.success) {
      onOpenChange(false);
      setTargetGrade("");
      setTargetStream("");
      if (onSuccess) onSuccess();
    }
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
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetStream">Target Stream</Label>
            <Select 
              value={targetStream} 
              onValueChange={setTargetStream}
              disabled={!targetGrade}
            >
              <SelectTrigger id="targetStream">
                <SelectValue placeholder={targetGrade ? "Select stream" : "Select grade first"} />
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
          <Button onClick={handlePromote} disabled={isPromoting}>
            {isPromoting ? "Promoting..." : "Promote Learners"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
