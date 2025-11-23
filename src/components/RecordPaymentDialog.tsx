import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { format } from "date-fns";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: any;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({ open, onOpenChange, invoice, onSuccess }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const { currentPeriod } = useAcademicPeriods();
  const { schoolInfo } = useSchoolInfo();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [learner, setLearner] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    admission_number: "",
    fee_structure_id: "",
    amount_paid: "",
    payment_method: "cash",
    receipt_number: "",
    payment_date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent || !lastPayment) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${lastPayment.receipt_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  useEffect(() => {
    if (open) {
      fetchFeeStructures();
      generateReceiptNumber();
    }
  }, [open]);

  const generateReceiptNumber = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("fee_payments")
      .select("*", { count: "exact", head: true });
    
    const nextNumber = (count || 0) + 1;
    const receiptNumber = `RCT-${year}-${String(nextNumber).padStart(6, "0")}`;
    setFormData(prev => ({ ...prev, receipt_number: receiptNumber }));
  };

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
      const { data, error } = await supabase
        .from("fee_payments")
        .insert([{
          learner_id: learner.id,
          fee_structure_id: formData.fee_structure_id,
          amount_paid: parseFloat(formData.amount_paid),
          payment_method: formData.payment_method,
          receipt_number: formData.receipt_number,
          payment_date: formData.payment_date,
          notes: formData.notes || null,
          status: "paid",
        }])
        .select(`
          *,
          learner:learners(
            admission_number,
            first_name,
            last_name,
            current_grade:grades(name)
          ),
          fee_structure:fee_structures(
            grade:grades(name),
            term,
            academic_year
          )
        `)
        .single();

      if (error) throw error;

      setLastPayment(data);

      toast({
        title: "Success",
        description: "Payment recorded successfully. You can now download the receipt.",
      });

      onSuccess?.();
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

  const handleClose = () => {
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
    setLastPayment(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
          </DialogHeader>

          {lastPayment ? (
            <div className="space-y-4">
              <div className="text-center py-6 bg-green-50 rounded-lg border-2 border-green-200">
                <h3 className="text-xl font-bold text-green-700 mb-2">Payment Recorded Successfully!</h3>
                <p className="text-green-600">Receipt Number: {lastPayment.receipt_number}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handlePrint} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download Receipt
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admission_number">Admission Number *</Label>
                <div className="relative">
                  <Input
                    id="admission_number"
                    value={formData.admission_number}
                    onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                    onBlur={(e) => verifyLearner(e.target.value)}
                    placeholder="Enter admission number"
                    required
                    disabled={verifying}
                  />
                  {verifying && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Searching...</span>
                    </div>
                  )}
                </div>
                {learner && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="font-semibold text-green-700">Learner Found</p>
                    </div>
                    <p className="font-medium text-lg">{learner.first_name} {learner.last_name}</p>
                    <p className="text-sm text-muted-foreground">Grade: {learner.current_grade?.name || "N/A"}</p>
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
              <Label htmlFor="receipt_number">Receipt Number *</Label>
              <Input
                id="receipt_number"
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                placeholder="Auto-generated"
                disabled
                className="bg-muted"
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
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !learner}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden receipt for printing */}
      <div style={{ display: "none" }}>
        {lastPayment && (
          <div ref={receiptRef}>
            <div style={{ backgroundColor: "white", padding: "48px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
              {/* Header */}
              <div style={{ textAlign: "center", borderBottom: "4px solid #1f2937", paddingBottom: "24px", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "16px" }}>
                  {schoolInfo?.logo_url && (
                    <img src={schoolInfo.logo_url} alt="School Logo" style={{ height: "80px", width: "80px", objectFit: "contain" }} />
                  )}
                  <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111827", textTransform: "uppercase", letterSpacing: "1px", margin: "0" }}>
                      {schoolInfo?.school_name || "School Name"}
                    </h1>
                    {schoolInfo?.motto && (
                      <p style={{ fontSize: "14px", color: "#6b7280", fontStyle: "italic", marginTop: "4px" }}>{schoolInfo.motto}</p>
                    )}
                  </div>
                </div>
                {schoolInfo?.address && <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0" }}>{schoolInfo.address}</p>}
                {(schoolInfo?.phone || schoolInfo?.email) && (
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0" }}>
                    {schoolInfo.phone && `Tel: ${schoolInfo.phone}`}
                    {schoolInfo.phone && schoolInfo.email && " | "}
                    {schoolInfo.email && `Email: ${schoolInfo.email}`}
                  </p>
                )}
              </div>

              {/* Receipt Title */}
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", textTransform: "uppercase", letterSpacing: "1px", backgroundColor: "#f3f4f6", padding: "12px", margin: "0" }}>
                  FEE PAYMENT RECEIPT
                </h2>
              </div>

              {/* Receipt Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px", fontSize: "14px" }}>
                <div>
                  <p style={{ fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Receipt No:</p>
                  <p style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", margin: "0" }}>{lastPayment.receipt_number}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: "600", color: "#374151", marginBottom: "4px" }}>Date:</p>
                  <p style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", margin: "0" }}>
                    {format(new Date(lastPayment.payment_date), "dd MMM yyyy")}
                  </p>
                </div>
              </div>

              {/* Learner Information */}
              <div style={{ border: "2px solid #d1d5db", borderRadius: "8px", padding: "24px", marginBottom: "32px", backgroundColor: "#f9fafb" }}>
                <h3 style={{ fontWeight: "bold", color: "#111827", marginBottom: "16px", fontSize: "18px", textTransform: "uppercase", margin: "0 0 16px 0" }}>Learner Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
                  <div>
                    <p style={{ color: "#6b7280", marginBottom: "4px", margin: "0 0 4px 0" }}>Name:</p>
                    <p style={{ fontWeight: "600", color: "#111827", fontSize: "16px", margin: "0" }}>
                      {lastPayment.learner.first_name} {lastPayment.learner.last_name}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#6b7280", marginBottom: "4px", margin: "0 0 4px 0" }}>Admission Number:</p>
                    <p style={{ fontWeight: "600", color: "#111827", fontSize: "16px", margin: "0" }}>{lastPayment.learner.admission_number}</p>
                  </div>
                  <div>
                    <p style={{ color: "#6b7280", marginBottom: "4px", margin: "0 0 4px 0" }}>Grade:</p>
                    <p style={{ fontWeight: "600", color: "#111827", fontSize: "16px", margin: "0" }}>
                      {lastPayment.learner.current_grade?.name || lastPayment.fee_structure?.grade?.name || "N/A"}
                    </p>
                  </div>
                  {lastPayment.fee_structure && (
                    <div>
                      <p style={{ color: "#6b7280", marginBottom: "4px", margin: "0 0 4px 0" }}>Academic Period:</p>
                      <p style={{ fontWeight: "600", color: "#111827", fontSize: "16px", margin: "0" }}>
                        {lastPayment.fee_structure.term.replace('_', ' ')} - {lastPayment.fee_structure.academic_year}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div style={{ border: "2px solid #d1d5db", borderRadius: "8px", overflow: "hidden", marginBottom: "32px" }}>
                <div style={{ backgroundColor: "#1f2937", color: "white", padding: "12px 24px" }}>
                  <h3 style={{ fontWeight: "bold", fontSize: "18px", textTransform: "uppercase", margin: "0" }}>Payment Details</h3>
                </div>
                <div style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ color: "#374151", fontWeight: "600" }}>Payment Method:</span>
                    <span style={{ fontWeight: "bold", color: "#111827", textTransform: "uppercase" }}>{lastPayment.payment_method.replace('_', ' ')}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 16px", backgroundColor: "#f9fafb", marginTop: "16px", borderRadius: "4px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "#111827" }}>Amount Paid:</span>
                    <span style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>
                      KES {lastPayment.amount_paid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {lastPayment.notes && (
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "4px", margin: "0 0 4px 0" }}>Notes:</p>
                      <p style={{ color: "#111827", margin: "0" }}>{lastPayment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "2px solid #d1d5db" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  <div>
                    <div style={{ borderTop: "2px solid #6b7280", paddingTop: "8px", marginTop: "48px" }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", margin: "0" }}>Received By</p>
                    </div>
                  </div>
                  <div>
                    <div style={{ borderTop: "2px solid #6b7280", paddingTop: "8px", marginTop: "48px" }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", margin: "0" }}>Authorized Signature</p>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: "32px", textAlign: "center", fontSize: "12px", color: "#6b7280", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                  <p style={{ fontWeight: "600", margin: "0 0 4px 0" }}>This is an official receipt for fee payment</p>
                  <p style={{ marginTop: "4px", margin: "4px 0" }}>Please keep this receipt for your records</p>
                  {schoolInfo?.bank_name && (
                    <p style={{ marginTop: "8px", margin: "8px 0 0 0" }}>
                      Bank: {schoolInfo.bank_name} | Account: {schoolInfo.bank_account_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
