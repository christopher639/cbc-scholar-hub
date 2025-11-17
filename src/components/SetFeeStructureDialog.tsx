import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface FeeItem {
  id: string;
  name: string;
  amount: string;
  type: string;
}

interface SetFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetFeeStructureDialog({ open, onOpenChange }: SetFeeStructureDialogProps) {
  const { toast } = useToast();
  const [grade, setGrade] = useState("");
  const [term, setTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [feeItems, setFeeItems] = useState<FeeItem[]>([
    { id: "1", name: "Tuition", amount: "", type: "Tuition" },
  ]);

  const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
  const terms = ["Term 1", "Term 2", "Term 3"];
  const feeTypes = ["Tuition", "Activity", "Exam", "Library", "Sports", "Transport", "Lunch", "Other"];

  const addFeeItem = () => {
    setFeeItems([
      ...feeItems,
      { id: Date.now().toString(), name: "", amount: "", type: "Tuition" },
    ]);
  };

  const removeFeeItem = (id: string) => {
    setFeeItems(feeItems.filter((item) => item.id !== id));
  };

  const updateFeeItem = (id: string, field: keyof FeeItem, value: string) => {
    setFeeItems(
      feeItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grade || !term || !academicYear) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const total = feeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    toast({
      title: "Fee Structure Saved",
      description: `Fee structure for ${grade} ${term} ${academicYear} saved. Total: KSH ${total.toLocaleString()}`,
    });
    onOpenChange(false);
  };

  const totalAmount = feeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Fee Structure</DialogTitle>
          <DialogDescription>Define fee structure for a specific grade and term</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Select value={grade} onValueChange={setGrade} required>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select grade" />
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
              <Label htmlFor="term">Term *</Label>
              <Select value={term} onValueChange={setTerm} required>
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Input
                id="academicYear"
                placeholder="2024/2025"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fee Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeeItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {feeItems.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-start border border-border rounded-lg p-3">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Item Name</Label>
                    <Input
                      placeholder="Fee item name"
                      value={item.name}
                      onChange={(e) => updateFeeItem(item.id, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount (KSH)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.amount}
                      onChange={(e) => updateFeeItem(item.id, "amount", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={item.type}
                      onValueChange={(value) => updateFeeItem(item.id, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {feeTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {feeItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeFeeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-lg font-semibold">Total Fee Amount:</span>
            <span className="text-2xl font-bold text-primary">
              KSH {totalAmount.toLocaleString()}
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Fee Structure</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
