import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { Plus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/currency";

interface SetFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FeeItem {
  category_id: string;
  amount: string;
  description: string;
}

export function SetFeeStructureDialog({ open, onOpenChange, onSuccess }: SetFeeStructureDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [gradeId, setGradeId] = useState("");
  const [term, setTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [feeItems, setFeeItems] = useState<FeeItem[]>([
    { category_id: "", amount: "", description: "" }
  ]);
  const { academicPeriods, currentPeriod } = useAcademicPeriods();
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchGrades();
      fetchCategories();
      fetchAcademicYears();
      if (currentPeriod) {
        setTerm(currentPeriod.term);
        setAcademicYear(currentPeriod.academic_year);
      }
    }
  }, [open, currentPeriod]);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .eq("is_active", true)
        .order("year", { ascending: false });
      if (error) throw error;
      setAcademicYears(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive",
      });
    }
  };

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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("fee_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addFeeItem = () => {
    setFeeItems([...feeItems, { category_id: "", amount: "", description: "" }]);
  };

  const removeFeeItem = (index: number) => {
    if (feeItems.length > 1) {
      setFeeItems(feeItems.filter((_, i) => i !== index));
    }
  };

  const updateFeeItem = (index: number, field: keyof FeeItem, value: string) => {
    const updated = [...feeItems];
    updated[index][field] = value;
    setFeeItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradeId) {
      toast({
        title: "Error",
        description: "Please select a grade",
        variant: "destructive",
      });
      return;
    }
    if (!term) {
      toast({
        title: "Error",
        description: "Please select a term",
        variant: "destructive",
      });
      return;
    }
    if (!academicYear) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "destructive",
      });
      return;
    }

    // Validate fee items
    const validItems = feeItems.filter(item => item.category_id && item.amount);
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one fee category with amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert multiple fee structures
      const feeStructures = validItems.map(item => ({
        grade_id: gradeId,
        term: term as any,
        academic_year: academicYear,
        amount: parseFloat(item.amount),
        category_id: item.category_id,
        description: item.description || null,
      }));

      const { error } = await supabase
        .from("fee_structures")
        .insert(feeStructures);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${validItems.length} fee structure(s) created successfully`,
      });
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setGradeId("");
      setTerm("");
      setAcademicYear("");
      setFeeItems([{ category_id: "", amount: "", description: "" }]);
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

  const getTotalAmount = () => {
    return feeItems
      .filter(item => item.amount)
      .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0)
      .toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Fee Structure</DialogTitle>
          <DialogDescription>Define fee structure with multiple categories for a specific grade and term</DialogDescription>
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

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year *</Label>
            <Select value={academicYear} onValueChange={setAcademicYear} required>
              <SelectTrigger id="academicYear">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((ay) => (
                  <SelectItem key={ay.id} value={ay.year}>{ay.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentPeriod && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current Period: <span className="font-semibold text-foreground">{currentPeriod.academic_year} · {currentPeriod.term.replace("_"," ")}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fee Categories *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeeItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </div>

            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-4">
                {feeItems.map((item, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {feeItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select
                          value={item.category_id}
                          onValueChange={(value) => updateFeeItem(index, "category_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Amount (KSh) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => updateFeeItem(index, "amount", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input
                        placeholder="e.g., Additional notes"
                        value={item.description}
                        onChange={(e) => updateFeeItem(index, "description", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Fee Amount:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(parseFloat(getTotalAmount()))}</span>
            </div>
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
