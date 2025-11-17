import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
  const streamColors = ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "White"];

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
            <Label htmlFor="grade">Grade *</Label>
            <Select value={grade} onValueChange={setGrade} required>
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streamName">Stream Name *</Label>
            <Select value={streamName} onValueChange={setStreamName} required>
              <SelectTrigger id="streamName">
                <SelectValue placeholder="Select stream color" />
              </SelectTrigger>
              <SelectContent>
                {streamColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color} Stream
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
