import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";

interface AddGradeStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGradeStreamDialog({ open, onOpenChange }: AddGradeStreamDialogProps) {
  const { toast } = useToast();
  const [grade, setGrade] = useState("");
  const [streamName, setStreamName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [classTeacher, setClassTeacher] = useState("");


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grade || !streamName || !capacity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Stream Created",
      description: `${grade} ${streamName} Stream created with capacity of ${capacity} learners`,
    });
    onOpenChange(false);
    setGrade("");
    setStreamName("");
    setCapacity("");
    setClassTeacher("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Grade/Stream</DialogTitle>
          <DialogDescription>
            Create a new stream for learners. Each stream must have a capacity limit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade Name *</Label>
            <Input
              id="grade"
              placeholder="e.g., Grade 1, Grade 2"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="streamName">Stream Name *</Label>
            <Input
              id="streamName"
              placeholder="e.g., Red, Blue, Green"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Stream Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="e.g., 75"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              required
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of learners that can be enrolled in this stream
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="classTeacher">Assign Class Teacher (Optional)</Label>
            <Input
              id="classTeacher"
              placeholder="Search for teacher..."
              value={classTeacher}
              onChange={(e) => setClassTeacher(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Stream</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
