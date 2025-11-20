import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Term = Database["public"]["Enums"]["term"];

interface FeeItem {
  item_name: string;
  amount: number;
  description?: string;
  is_optional: boolean;
}

interface TermFees {
  term_1: FeeItem[];
  term_2: FeeItem[];
  term_3: FeeItem[];
}

interface SetFeeStructureDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SetFeeStructureDialogEnhanced({
  open,
  onOpenChange,
  onSuccess,
}: SetFeeStructureDialogEnhancedProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  const [termFees, setTermFees] = useState<TermFees>({
    term_1: [{ item_name: "", amount: 0, description: "", is_optional: false }],
    term_2: [{ item_name: "", amount: 0, description: "", is_optional: false }],
    term_3: [{ item_name: "", amount: 0, description: "", is_optional: false }],
  });

  useEffect(() => {
    if (open) {
      fetchGrades();
      fetchAcademicYears();
    }
  }, [open]);

  const fetchGrades = async () => {
    const { data } = await supabase.from("grades").select("*").order("name");
    setGrades(data || []);
  };

  const fetchAcademicYears = async () => {
    const { data } = await supabase.from("academic_years").select("*").order("year", { ascending: false });
    setAcademicYears(data || []);
  };

  const addFeeItem = (term: Term) => {
    setTermFees(prev => ({
      ...prev,
      [term]: [...prev[term], { item_name: "", amount: 0, description: "", is_optional: false }]
    }));
  };

  const removeFeeItem = (term: Term, index: number) => {
    setTermFees(prev => ({
      ...prev,
      [term]: prev[term].filter((_, i) => i !== index)
    }));
  };

  const updateFeeItem = (term: Term, index: number, field: keyof FeeItem, value: any) => {
    setTermFees(prev => ({
      ...prev,
      [term]: prev[term].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTermTotal = (term: Term) => {
    return termFees[term].reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const handleSubmit = async () => {
    if (!selectedGrade || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select grade and academic year",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Create fee structures for each term
      const terms: Term[] = ["term_1", "term_2", "term_3"];
      
      for (const term of terms) {
        const items = termFees[term].filter(item => item.item_name && item.amount > 0);
        
        if (items.length === 0) continue;

        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

        // Insert fee structure
        const { data: structure, error: structureError } = await supabase
          .from("fee_structures")
          .insert({
            grade_id: selectedGrade,
            academic_year: selectedYear,
            term: term,
            amount: totalAmount,
            description: `Fee structure for ${term.replace("_", " ").toUpperCase()}`,
          })
          .select()
          .single();

        if (structureError) throw structureError;

        // Insert fee structure items
        const itemsToInsert = items.map((item, index) => ({
          fee_structure_id: structure.id,
          item_name: item.item_name,
          amount: item.amount,
          description: item.description,
          is_optional: item.is_optional,
          display_order: index,
        }));

        const { error: itemsError } = await supabase
          .from("fee_structure_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: "Fee structures created successfully",
      });

      onSuccess?.();
      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setSelectedGrade("");
    setSelectedYear("");
    setTermFees({
      term_1: [{ item_name: "", amount: 0, description: "", is_optional: false }],
      term_2: [{ item_name: "", amount: 0, description: "", is_optional: false }],
      term_3: [{ item_name: "", amount: 0, description: "", is_optional: false }],
    });
  };

  const renderTermSection = (term: Term, termLabel: string) => (
    <Card key={term} className="border-2">
      <CardHeader className="bg-secondary/30">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {termLabel}
          </span>
          <span className="text-primary font-mono">
            Total: ${calculateTermTotal(term).toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {termFees[term].map((item, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg bg-card">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Fee Item *</Label>
                <Input
                  placeholder="e.g., Tuition Fee"
                  value={item.item_name}
                  onChange={(e) => updateFeeItem(term, index, "item_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={item.amount || ""}
                  onChange={(e) => updateFeeItem(term, index, "amount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Optional details"
                  value={item.description}
                  onChange={(e) => updateFeeItem(term, index, "description", e.target.value)}
                />
              </div>
            </div>
            {termFees[term].length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFeeItem(term, index)}
                className="w-fit text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => addFeeItem(term)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Fee Item
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Fee Structure - PDF-Style Editor</DialogTitle>
          <DialogDescription>
            Create detailed term-wise fee structures for a grade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grade and Year Selection */}
          <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg bg-secondary/20">
            <div className="space-y-2">
              <Label>Grade / Class *</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
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
              <Label>Academic Year *</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.year}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Term Sections */}
          <div className="space-y-6">
            {renderTermSection("term_1", "TERM 1")}
            {renderTermSection("term_2", "TERM 2")}
            {renderTermSection("term_3", "TERM 3")}
          </div>

          {/* Grand Total */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">TOTAL ANNUAL FEES</span>
                <span className="text-3xl font-bold text-primary font-mono">
                  ${(calculateTermTotal("term_1") + calculateTermTotal("term_2") + calculateTermTotal("term_3")).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Fee Structure"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
