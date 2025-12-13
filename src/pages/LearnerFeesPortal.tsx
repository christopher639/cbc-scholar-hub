import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLearners } from "@/hooks/useLearners";
import { useInvoices } from "@/hooks/useInvoices";
import { useTransactions } from "@/hooks/useTransactions";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingDown, FileText, Receipt, Smartphone, Info } from "lucide-react";
import { format } from "date-fns";
import { MpesaPaymentDialog } from "@/components/MpesaPaymentDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LearnerFeesPortal() {
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>("");
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const { learners, loading: learnersLoading } = useLearners();
  const { invoices, loading: invoicesLoading, fetchInvoices } = useInvoices(selectedLearnerId);
  const { transactions, loading: transactionsLoading, fetchTransactions } = useTransactions(undefined, selectedLearnerId);
  const { currentPeriod } = useAcademicPeriods();

  const selectedLearner = learners.find(l => l.id === selectedLearnerId);

  const handleMpesaPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setMpesaDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchInvoices();
    fetchTransactions();
  };

  // Fetch fee_payments for selected learner
  useEffect(() => {
    const fetchFeePayments = async () => {
      if (!selectedLearnerId) {
        setFeePayments([]);
        return;
      }
      
      const { data } = await supabase
        .from("fee_payments")
        .select(`
          *,
          fee_structure:fee_structures(academic_year, term)
        `)
        .eq("learner_id", selectedLearnerId)
        .order("payment_date", { ascending: false });
      
      setFeePayments(data || []);
    };
    
    fetchFeePayments();
  }, [selectedLearnerId]);

  // Calculate current term invoice and balance
  const currentTermInvoice = invoices.find(
    inv => inv.academic_year === currentPeriod?.academic_year && inv.term === currentPeriod?.term
  );

  // Calculate current term paid from actual transactions
  const currentTermTransactions = transactions.filter(
    t => t.invoice?.academic_year === currentPeriod?.academic_year &&
         t.invoice?.term === currentPeriod?.term
  );
  
  const currentTermFeePayments = feePayments.filter(
    p => p.fee_structure?.academic_year === currentPeriod?.academic_year &&
         p.fee_structure?.term === currentPeriod?.term
  );
  
  const currentTermPaid = 
    currentTermTransactions.reduce((sum, t) => sum + Number(t.amount_paid), 0) +
    currentTermFeePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  
  const currentTermFees = currentTermInvoice ? Number(currentTermInvoice.total_amount) : 0;
  const currentTermBalance = currentTermFees - currentTermPaid;

  // Calculate overall totals from actual transactions
  const totalPaidFromTransactions = transactions.reduce((sum, t) => sum + Number(t.amount_paid), 0);
  const totalPaidFromFeePayments = feePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const totalPaid = totalPaidFromTransactions + totalPaidFromFeePayments;
  
  const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const overallBalance = totalDue - totalPaid;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Learner Fees Portal</h1>
          <p className="text-muted-foreground">
            View comprehensive fee information and payment history
          </p>
        </div>

        {/* Learner Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Learner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label>Learner</Label>
              <Select value={selectedLearnerId} onValueChange={setSelectedLearnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a learner" />
                </SelectTrigger>
                <SelectContent>
                  {learners.map((learner) => (
                    <SelectItem key={learner.id} value={learner.id}>
                      {learner.admission_number} - {learner.first_name} {learner.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedLearnerId && selectedLearner && (
          <>
            {/* Learner Info */}
            <Card>
              <CardHeader>
                <CardTitle>Learner Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedLearner.first_name} {selectedLearner.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admission Number</p>
                    <p className="font-medium">{selectedLearner.admission_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grade</p>
                    <p className="font-medium">{selectedLearner.current_grade?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Academic Year</p>
                    <p className="font-medium">{currentPeriod?.academic_year || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Current Term Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${currentTermBalance < 0 ? 'text-primary' : currentTermBalance > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {currentTermBalance < 0 && '-'}${Math.abs(currentTermBalance).toFixed(2)}
                  </div>
                  {currentTermBalance < 0 && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Overpaid (Credit)
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Overall Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${overallBalance < 0 ? 'text-primary' : overallBalance > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {overallBalance < 0 && '-'}${Math.abs(overallBalance).toFixed(2)}
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
                  <div className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</div>
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
                  <div className="text-2xl font-bold">${totalDue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Annual</p>
                </CardContent>
              </Card>
            </div>

            {/* M-Pesa Payment Instructions */}
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <Smartphone className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-400">Pay via M-Pesa</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-2">
                  <p className="font-medium">To pay school fees via M-Pesa:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to M-Pesa menu on your phone</li>
                    <li>Select <strong>Lipa na M-Pesa</strong> → <strong>Pay Bill</strong></li>
                    <li>Enter Business Number: <strong className="font-mono">600426</strong></li>
                    <li>Enter Account Number: <strong className="font-mono">{selectedLearner?.admission_number}</strong></li>
                    <li>Enter the amount you wish to pay</li>
                    <li>Confirm and enter your M-Pesa PIN</li>
                  </ol>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Payments are automatically recorded to the learner's account using the admission number as reference.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Invoices</CardTitle>
                <CardDescription>Term-wise fee breakdown - Click "Pay via M-Pesa" to initiate payment</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading invoices...</p>
                ) : invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoices found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.term.replace("_", " ").toUpperCase()}</TableCell>
                          <TableCell>{invoice.academic_year}</TableCell>
                          <TableCell className="text-right">${Number(invoice.total_amount).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${Number(invoice.amount_paid).toFixed(2)}</TableCell>
                          <TableCell className={`text-right font-medium ${Number(invoice.balance_due) < 0 ? 'text-primary' : Number(invoice.balance_due) > 0 ? 'text-destructive' : ''}`}>
                            {Number(invoice.balance_due) < 0 && '-'}${Math.abs(Number(invoice.balance_due)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              invoice.status === 'paid' ? 'default' :
                              invoice.status === 'partial' ? 'secondary' :
                              invoice.status === 'overdue' ? 'destructive' :
                              'outline'
                            }>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invoice.status !== 'paid' && Number(invoice.balance_due) > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                                onClick={() => handleMpesaPayment(invoice)}
                              >
                                <Smartphone className="h-3 w-3 mr-1" />
                                M-Pesa
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All recorded payments</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">{transaction.transaction_number}</TableCell>
                          <TableCell>{format(new Date(transaction.payment_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-mono text-xs">{transaction.invoice?.invoice_number}</TableCell>
                          <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            ${Number(transaction.amount_paid).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {transaction.reference_number || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* M-Pesa Payment Dialog */}
      <MpesaPaymentDialog
        open={mpesaDialogOpen}
        onOpenChange={setMpesaDialogOpen}
        learnerId={selectedLearnerId}
        learnerName={selectedLearner ? `${selectedLearner.first_name} ${selectedLearner.last_name}` : undefined}
        admissionNumber={selectedLearner?.admission_number}
        invoiceId={selectedInvoice?.id}
        amount={selectedInvoice ? Number(selectedInvoice.balance_due) : undefined}
        onSuccess={handlePaymentSuccess}
      />
    </DashboardLayout>
  );
}
