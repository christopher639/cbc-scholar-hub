import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: {
    id: string;
    name: string;
    description: string | null;
    is_last_grade: boolean | null;
  };
  onSuccess: () => void;
}

export function EditGradeDialog({ open, onOpenChange, grade, onSuccess }: EditGradeDialogProps) {
  const [name, setName] = useState(grade.name);
  const [description, setDescription] = useState(grade.description || "");
  const [isLastGrade, setIsLastGrade] = useState(grade.is_last_grade || false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Grade name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("grades")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          is_last_grade: isLastGrade,
        })
        .eq("id", grade.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grade updated successfully. All learners and records have been updated.",
      });

      onSuccess();
      onOpenChange(false);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Grade</DialogTitle>
          <DialogDescription>
            Update grade information. This will automatically update all learners and records using this grade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Grade Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grade 8"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isLastGrade"
                checked={isLastGrade}
                onCheckedChange={(checked) => setIsLastGrade(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="isLastGrade" className="cursor-pointer">
                This is the last grade (learners will be promoted to alumni)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
