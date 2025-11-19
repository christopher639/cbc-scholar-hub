import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SetLastGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gradeId: string;
  gradeName: string;
  isCurrentlyLastGrade: boolean;
  onSuccess?: () => void;
}

export function SetLastGradeDialog({
  open,
  onOpenChange,
  gradeId,
  gradeName,
  isCurrentlyLastGrade,
  onSuccess,
}: SetLastGradeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("grades")
        .update({ is_last_grade: !isCurrentlyLastGrade })
        .eq("id", gradeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${gradeName} has been ${!isCurrentlyLastGrade ? "set as" : "removed from"} the last grade`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCurrentlyLastGrade ? "Remove as Last Grade" : "Set as Last Grade"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isCurrentlyLastGrade
                ? `Removing ${gradeName} as the last grade means learners promoted from this grade will move to the next grade level instead of becoming alumni.`
                : `Setting ${gradeName} as the last grade means learners promoted from this grade will automatically become alumni and will no longer count as active learners.`}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleToggle} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : isCurrentlyLastGrade ? "Remove Last Grade" : "Set as Last Grade"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
