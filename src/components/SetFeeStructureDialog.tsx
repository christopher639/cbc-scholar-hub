import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";

interface SetFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SetFeeStructureDialog({ open, onOpenChange, onSuccess }: SetFeeStructureDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [gradeId, setGradeId] = useState("");
  const [term, setTerm] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const { currentPeriod } = useAcademicPeriods();

  useEffect(() => {
    if (open) {
      fetchGrades();
      if (currentPeriod) {
        setTerm(currentPeriod.term);
      }
    }
  }, [open, currentPeriod]);

  const fetchGrades = async () => {
    try {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .order("grade_level", { ascending: true });

      if (error) throw error;
      setGrades(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradeId || !term || !amount || !currentPeriod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("fee_structures")
        .insert({
          grade_id: gradeId,
          term: term as any,
          academic_year: currentPeriod.academic_year,
          amount: parseFloat(amount),
          description: description || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee structure created successfully",
      });
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setGradeId("");
      setTerm("");
      setAmount("");
      setDescription("");
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Set Fee Structure</DialogTitle>
          <DialogDescription>Define fee structure for a specific grade and term</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Select value={gradeId} onValueChange={setGradeId} required>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term *</Label>
              <Select value={term} onValueChange={setTerm} required>
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term_1">Term 1</SelectItem>
                  <SelectItem value="term_2">Term 2</SelectItem>
                  <SelectItem value="term_3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentPeriod && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Academic Year: <span className="font-semibold text-foreground">{currentPeriod.academic_year}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Total Fee Amount (KSH) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="e.g., Tuition, activity fees, exam fees"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Fee Structure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
