import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface AddGradeStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGradeStreamDialog({ open, onOpenChange }: AddGradeStreamDialogProps) {
  const { toast } = useToast();
  const [gradeName, setGradeName] = useState("");
  const [streamName, setStreamName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(false);

  const gradeNameToLevel = (name: string): Database["public"]["Enums"]["grade_level"] | null => {
    const match = name.match(/(\d+)/);
    if (!match) return null;
    const gradeNum = parseInt(match[1]);
    if (gradeNum >= 1 && gradeNum <= 12) {
      return `grade_${gradeNum}` as Database["public"]["Enums"]["grade_level"];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradeName || !streamName || !capacity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const gradeLevel = gradeNameToLevel(gradeName);
    if (!gradeLevel) {
      toast({
        title: "Error",
        description: "Please enter a valid grade (e.g., Grade 1, Grade 2, etc.)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // First, get or create the grade
      const { data: existingGrade } = await supabase
        .from("grades")
        .select("id")
        .eq("grade_level", gradeLevel)
        .maybeSingle();

      let gradeId = existingGrade?.id;

      if (!gradeId) {
        const { data: newGrade, error: gradeError } = await supabase
          .from("grades")
          .insert({
            name: gradeName,
            grade_level: gradeLevel,
          })
          .select("id")
          .single();

        if (gradeError) throw gradeError;
        gradeId = newGrade.id;
      }

      // Create the stream
      const { error: streamError } = await supabase
        .from("streams")
        .insert({
          name: streamName,
          grade_id: gradeId,
          capacity: parseInt(capacity),
        });

      if (streamError) throw streamError;

      toast({
        title: "Success",
        description: `${gradeName} ${streamName} Stream created with capacity of ${capacity} learners`,
      });

      onOpenChange(false);
      setGradeName("");
      setStreamName("");
      setCapacity("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the grade name (e.g., Grade 1, Grade 2, etc.)
            </p>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Stream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
