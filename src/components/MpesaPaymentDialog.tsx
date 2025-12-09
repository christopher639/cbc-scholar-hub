import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Phone, CreditCard, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface MpesaPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerId?: string;
  learnerName?: string;
  admissionNumber?: string;
  invoiceId?: string;
  amount?: number;
  onSuccess?: () => void;
}

export function MpesaPaymentDialog({
  open,
  onOpenChange,
  learnerId,
  learnerName,
  admissionNumber,
  invoiceId,
  amount: defaultAmount,
  onSuccess,
}: MpesaPaymentDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState(defaultAmount?.toString() || "");
  const [loading, setLoading] = useState(false);
  const [stkSent, setStkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !amount || !admissionNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber,
          amount: parseFloat(amount),
          accountReference: admissionNumber,
          learnerId,
          invoiceId,
        },
      });

      if (error) throw error;

      if (data.success) {
        setStkSent(true);
        toast.success("STK Push Sent", {
          description: "Please check your phone and enter M-Pesa PIN to complete payment",
        });
      } else {
        throw new Error(data.error || 'Failed to initiate payment');
      }
    } catch (error: unknown) {
      console.error('M-Pesa error:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate M-Pesa payment';
      toast.error("Payment Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!phoneNumber || !amount || !admissionNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-simulate', {
        body: {
          phoneNumber,
          amount: parseFloat(amount),
          accountReference: admissionNumber,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Payment Simulated", {
          description: "C2B payment simulation sent successfully",
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(data.error || data.message || 'Simulation failed');
      }
    } catch (error: unknown) {
      console.error('Simulation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to simulate payment';
      toast.error("Simulation Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStkSent(false);
    setPhoneNumber("");
    if (!defaultAmount) setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            Pay school fees via M-Pesa paybill
          </DialogDescription>
        </DialogHeader>

        {stkSent ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">STK Push Sent!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p><strong>Amount:</strong> {formatCurrency(parseFloat(amount))}</p>
              <p><strong>Account:</strong> {admissionNumber}</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {learnerName && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>Learner:</strong> {learnerName}</p>
                <p><strong>Admission No:</strong> {admissionNumber}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the phone number to receive STK push
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KSh)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account Reference</Label>
              <Input
                id="account"
                value={admissionNumber || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Use learner's admission number as account reference
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay with M-Pesa
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-full"
              >
                Simulate C2B Payment (Sandbox)
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Powered by Safaricom Daraja API
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
