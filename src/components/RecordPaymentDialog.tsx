import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: any;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({ open, onOpenChange, invoice, onSuccess }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const { currentPeriod } = useAcademicPeriods();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [learner, setLearner] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    admission_number: "",
    fee_structure_id: "",
    amount_paid: "",
    payment_method: "cash",
    receipt_number: "",
    payment_date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchFeeStructures();
    }
  }, [open]);

  // Auto-fill fee structure based on current academic period when learner is verified
  useEffect(() => {
    if (learner && currentPeriod && feeStructures.length > 0) {
      const matchingStructure = feeStructures.find(
        fs => fs.grade_id === learner.current_grade?.id && 
             fs.academic_year === currentPeriod.academic_year &&
             fs.term === currentPeriod.term
      );
      if (matchingStructure) {
        setFormData(prev => ({ ...prev, fee_structure_id: matchingStructure.id }));
      }
    }
  }, [learner, currentPeriod, feeStructures]);

  const fetchFeeStructures = async () => {
    try {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*, grade:grades(name)")
        .order("academic_year", { ascending: false });

      if (error) throw error;
      setFeeStructures(data || []);
    } catch (error: any) {
      console.error("Error fetching fee structures:", error);
    }
  };

  const verifyLearner = async (admissionNumber: string) => {
    if (!admissionNumber.trim()) {
      setLearner(null);
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from("learners")
        .select("*, current_grade:grades(id, name)")
        .eq("admission_number", admissionNumber.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLearner(data);
      } else {
        setLearner(null);
        toast({
          title: "Learner Not Found",
          description: "No learner found with this admission number",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error verifying learner:", error);
      toast({
        title: "Error",
        description: "Failed to verify learner",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!learner) {
      toast({
        title: "Invalid Learner",
        description: "Please enter a valid admission number",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fee_structure_id || !formData.amount_paid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("fee_payments")
        .insert([{
          learner_id: learner.id,
          fee_structure_id: formData.fee_structure_id,
          amount_paid: parseFloat(formData.amount_paid),
          payment_method: formData.payment_method,
          receipt_number: formData.receipt_number || null,
          payment_date: formData.payment_date,
          notes: formData.notes || null,
          status: "paid",
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      // Reset form
      setFormData({
        admission_number: "",
        fee_structure_id: "",
        amount_paid: "",
        payment_method: "cash",
        receipt_number: "",
        payment_date: new Date().toISOString().split('T')[0],
        notes: "",
      });
      setLearner(null);
      
      onSuccess?.();
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Fee Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admission_number">Admission Number *</Label>
            <div className="flex gap-2">
              <Input
                id="admission_number"
                value={formData.admission_number}
                onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                onBlur={(e) => verifyLearner(e.target.value)}
                placeholder="Enter admission number"
                required
              />
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {learner && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium">{learner.first_name} {learner.last_name}</p>
                <p className="text-muted-foreground">Grade: {learner.current_grade?.name || "N/A"}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fee_structure_id">Fee Structure *</Label>
              <Select
                value={formData.fee_structure_id}
                onValueChange={(value) => setFormData({ ...formData, fee_structure_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fee structure" />
                </SelectTrigger>
                <SelectContent>
                  {feeStructures.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id}>
                      {structure.grade?.name} - {structure.term.replace('_', ' ')} {structure.academic_year} (KES {structure.amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount_paid">Amount Paid (KES) *</Label>
              <Input
                id="amount_paid"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_number">Receipt Number</Label>
              <Input
                id="receipt_number"
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !learner}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
