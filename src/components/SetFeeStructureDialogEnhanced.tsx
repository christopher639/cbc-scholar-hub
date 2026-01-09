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
  existingStructure?: any;
}

export function SetFeeStructureDialogEnhanced({
  open,
  onOpenChange,
  onSuccess,
  existingStructure,
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
      
      if (existingStructure) {
        // Load existing structure for editing
        setSelectedGrade(existingStructure.gradeId);
        setSelectedYear(existingStructure.academicYear);
        
        // Load fee items for the specific term
        if (existingStructure.fee_structure_items) {
          const items = existingStructure.fee_structure_items.map((item: any) => ({
            item_name: item.item_name,
            amount: Number(item.amount),
            description: item.description || "",
            is_optional: item.is_optional || false,
          }));
          
          setTermFees(prev => ({
            ...prev,
            [existingStructure.term]: items.length > 0 ? items : [{ item_name: "", amount: 0, description: "", is_optional: false }]
          }));
        }
      } else {
        // Reset for new structure
        setSelectedGrade("");
        setSelectedYear("");
        setTermFees({
          term_1: [{ item_name: "", amount: 0, description: "", is_optional: false }],
          term_2: [{ item_name: "", amount: 0, description: "", is_optional: false }],
          term_3: [{ item_name: "", amount: 0, description: "", is_optional: false }],
        });
      }
    }
  }, [open, existingStructure]);

  // Auto-fill when grade and year are selected
  useEffect(() => {
    if (open && selectedGrade && selectedYear && !existingStructure) {
      fetchExistingFeeStructures();
    }
  }, [selectedGrade, selectedYear, open, existingStructure]);

  const fetchExistingFeeStructures = async () => {
    if (!selectedGrade || !selectedYear) return;

    const { data } = await supabase
      .from("fee_structures")
      .select(`*, fee_structure_items(*)`)
      .eq("grade_id", selectedGrade)
      .eq("academic_year", selectedYear);

    if (data && data.length > 0) {
      const newTermFees: TermFees = {
        term_1: [{ item_name: "", amount: 0, description: "", is_optional: false }],
        term_2: [{ item_name: "", amount: 0, description: "", is_optional: false }],
        term_3: [{ item_name: "", amount: 0, description: "", is_optional: false }],
      };

      data.forEach((structure: any) => {
        const term = structure.term as Term;
        if (structure.fee_structure_items && structure.fee_structure_items.length > 0) {
          newTermFees[term] = structure.fee_structure_items.map((item: any) => ({
            item_name: item.item_name,
            amount: Number(item.amount),
            description: item.description || "",
            is_optional: item.is_optional || false,
          }));
        }
      });

      setTermFees(newTermFees);
    }
  };

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

      if (existingStructure) {
        // Update existing fee structure
        const term = existingStructure.term;
        const items = termFees[term].filter(item => item.item_name && item.amount > 0);
        
        if (items.length === 0) {
          toast({
            title: "Error",
            description: "Please add at least one fee item",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

        // Update fee structure
        const { error: structureError } = await supabase
          .from("fee_structures")
          .update({
            amount: totalAmount,
            description: `Fee structure for ${term.replace("_", " ").toUpperCase()}`,
          })
          .eq("id", existingStructure.id);

        if (structureError) throw structureError;

        // Delete old items
        const { error: deleteError } = await supabase
          .from("fee_structure_items")
          .delete()
          .eq("fee_structure_id", existingStructure.id);

        if (deleteError) throw deleteError;

        // Insert new items
        const itemsToInsert = items.map((item, index) => ({
          fee_structure_id: existingStructure.id,
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

        toast({
          title: "Success",
          description: "Fee structure updated successfully",
        });
      } else {
        // Create new fee structures for each term
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
      }

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
    <Card key={term} className="border border-border">
      <CardHeader className="bg-muted/50 py-4">
        <CardTitle className="text-base flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {termLabel}
          </span>
          <span className="font-mono text-sm">
            Total: KSh {calculateTermTotal(term).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {termFees[term].map((item, index) => (
          <div key={index} className="grid gap-4 p-4 border border-border rounded-lg bg-background">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-foreground">Fee Item *</Label>
                <Input
                  placeholder="e.g., Tuition Fee"
                  value={item.item_name}
                  onChange={(e) => updateFeeItem(term, index, "item_name", e.target.value)}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Amount *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={item.amount || ""}
                  onChange={(e) => updateFeeItem(term, index, "amount", parseFloat(e.target.value) || 0)}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Description</Label>
                <Input
                  placeholder="Optional details"
                  value={item.description}
                  onChange={(e) => updateFeeItem(term, index, "description", e.target.value)}
                  className="text-foreground"
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
          <DialogTitle>
            {existingStructure ? "Edit Fee Structure" : "Set Fee Structure - PDF-Style Editor"}
          </DialogTitle>
          <DialogDescription>
            {existingStructure 
              ? `Update fee structure for ${existingStructure.term.replace("_", " ").toUpperCase()} - ${existingStructure.academicYear}`
              : "Create detailed term-wise fee structures for a grade"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grade and Year Selection */}
          <div className="grid gap-4 md:grid-cols-2 p-4 border border-border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label className="text-foreground">Grade / Class *</Label>
              <Select 
                value={selectedGrade} 
                onValueChange={setSelectedGrade}
                disabled={!!existingStructure}
              >
                <SelectTrigger className="text-foreground">
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
              <Label className="text-foreground">Academic Year *</Label>
              <Select 
                value={selectedYear} 
                onValueChange={setSelectedYear}
                disabled={!!existingStructure}
              >
                <SelectTrigger className="text-foreground">
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
            {existingStructure ? (
              // When editing, only show the specific term
              renderTermSection(existingStructure.term as Term, existingStructure.term.replace("_", " ").toUpperCase())
            ) : (
              // When creating, show all terms
              <>
                {renderTermSection("term_1", "TERM 1")}
                {renderTermSection("term_2", "TERM 2")}
                {renderTermSection("term_3", "TERM 3")}
              </>
            )}
          </div>

          {/* Grand Total - Only show when creating all terms */}
          {!existingStructure && (
            <Card className="border border-border bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-foreground">TOTAL ANNUAL FEES</span>
                  <span className="text-xl font-bold text-foreground font-mono">
                    KSh {(calculateTermTotal("term_1") + calculateTermTotal("term_2") + calculateTermTotal("term_3")).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

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
