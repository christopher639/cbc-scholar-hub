import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TransferLearnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: any;
  onSuccess?: () => void;
}

export function TransferLearnerDialog({
  open,
  onOpenChange,
  learner,
  onSuccess,
}: TransferLearnerDialogProps) {
  const [destinationSchool, setDestinationSchool] = useState("");
  const [reason, setReason] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleTransfer = async () => {
    if (!destinationSchool.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the destination school",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create transfer record
      const { error: transferError } = await supabase
        .from("transfer_records")
        .insert({
          learner_id: learner.id,
          destination_school: destinationSchool,
          reason: reason || null,
          transfer_date: transferDate,
        });

      if (transferError) throw transferError;

      // Update learner status
      const { error: updateError } = await supabase
        .from("learners")
        .update({ status: "transferred" })
        .eq("id", learner.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Learner marked as transferred successfully",
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
          <DialogTitle>Transfer Learner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Learner</Label>
            <p className="text-sm text-muted-foreground">
              {learner?.first_name} {learner?.last_name} ({learner?.admission_number})
            </p>
          </div>
          <div>
            <Label htmlFor="destination_school">Destination School *</Label>
            <Input
              id="destination_school"
              value={destinationSchool}
              onChange={(e) => setDestinationSchool(e.target.value)}
              placeholder="Enter destination school name"
            />
          </div>
          <div>
            <Label htmlFor="transfer_date">Transfer Date</Label>
            <Input
              id="transfer_date"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for transfer (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Transfer Learner"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
