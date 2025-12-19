import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Receipt, FileText, Wallet } from "lucide-react";
import { format } from "date-fns";

export default function LearnerFeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const learner = user?.data;
  const [loading, setLoading] = useState(true);
  const [feeInfo, setFeeInfo] = useState({
    totalAccumulatedFees: 0,
    totalPaid: 0,
    totalBalance: 0,
    currentTermFees: 0,
    currentTermPaid: 0,
    currentTermBalance: 0,
    payments: [] as any[],
  });

  useEffect(() => {
    if (learner) {
      fetchFeeData();
    }
  }, [learner]);

  const fetchFeeData = async () => {
    if (!learner) return;

    try {
      setLoading(true);

      // Fetch all invoices
      const { data: invoices } = await supabase
        .from("student_invoices")
        .select("*")
        .eq("learner_id", learner.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("fee_transactions")
        .select(`
          *,
          invoice:student_invoices(invoice_number, academic_year, term)
        `)
        .eq("learner_id", learner.id)
        .order("payment_date", { ascending: false });

      // Fetch legacy payments
      const { data: feePayments } = await supabase
        .from("fee_payments")
        .select(`
          *,
          fee_structure:fee_structures(academic_year, term)
        `)
        .eq("learner_id", learner.id)
        .order("payment_date", { ascending: false });

      // Calculate totals
      const totalAccumulated = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      const totalPaidFromTransactions = transactions?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;
      const totalPaidFromFeePayments = feePayments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const totalPaid = totalPaidFromTransactions + totalPaidFromFeePayments;
      const totalBalance = totalAccumulated - totalPaid;

      // Get current period
      const { data: currentPeriod } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("is_current", true)
        .maybeSingle();

      let currentTermFees = 0;
      let currentTermPaid = 0;

      if (currentPeriod && invoices) {
        const currentInvoice = invoices.find(
          inv => inv.academic_year === currentPeriod.academic_year && inv.term === currentPeriod.term
        );

        if (currentInvoice) {
          currentTermFees = Number(currentInvoice.total_amount);
          
          const currentTermTransactions = transactions?.filter(
            t => t.invoice?.academic_year === currentPeriod.academic_year &&
                 t.invoice?.term === currentPeriod.term
          ) || [];
          
          const currentTermFeePayments = feePayments?.filter(
            p => p.fee_structure?.academic_year === currentPeriod.academic_year &&
                 p.fee_structure?.term === currentPeriod.term
          ) || [];
          
          currentTermPaid = 
            currentTermTransactions.reduce((sum, t) => sum + Number(t.amount_paid), 0) +
            currentTermFeePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
        }
      }

      // Combine all payments
      const allPayments = [
        ...(transactions || []).map(txn => ({
          id: txn.id,
          amount_paid: txn.amount_paid,
          payment_date: txn.payment_date,
          payment_method: txn.payment_method,
          receipt_number: txn.receipt_number || txn.transaction_number,
          type: 'transaction'
        })),
        ...(feePayments || []).map(pmt => ({
          id: pmt.id,
          amount_paid: pmt.amount_paid,
          payment_date: pmt.payment_date,
          payment_method: pmt.payment_method || 'Payment',
          receipt_number: pmt.receipt_number,
          type: 'legacy'
        }))
      ].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

      setFeeInfo({
        totalAccumulatedFees: totalAccumulated,
        totalPaid,
        totalBalance,
        currentTermFees,
        currentTermPaid,
        currentTermBalance: currentTermFees - currentTermPaid,
        payments: allPayments,
      });
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-2">My Fees</h1>
        <p className="text-sm text-muted-foreground">View your fee summary and payment history</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Current Term Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-destructive">
              KES {feeInfo.currentTermBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This Term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-destructive">
              KES {feeInfo.totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All Terms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-primary">
              KES {feeInfo.totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All Payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              KES {feeInfo.totalAccumulatedFees.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Accumulated</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recorded fee payments</CardDescription>
        </CardHeader>
        <CardContent>
          {feeInfo.payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeInfo.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.payment_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.receipt_number || "-"}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        KES {Number(payment.amount_paid).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
