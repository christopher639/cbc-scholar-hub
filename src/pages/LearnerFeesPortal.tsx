import { useState } from "react";
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
import { DollarSign, TrendingDown, TrendingUp, FileText, Receipt } from "lucide-react";
import { format } from "date-fns";

export default function LearnerFeesPortal() {
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>("");
  const { learners, loading: learnersLoading } = useLearners();
  const { invoices, loading: invoicesLoading } = useInvoices(selectedLearnerId);
  const { transactions, loading: transactionsLoading } = useTransactions(undefined, selectedLearnerId);
  const { currentPeriod } = useAcademicPeriods();

  const selectedLearner = learners.find(l => l.id === selectedLearnerId);

  // Calculate current term balance
  const currentTermInvoice = invoices.find(
    inv => inv.academic_year === currentPeriod?.academic_year && inv.term === currentPeriod?.term
  );

  const currentTermBalance = currentTermInvoice 
    ? currentTermInvoice.balance_due 
    : 0;

  // Calculate overall balance (all invoices)
  const overallBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

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

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Invoices</CardTitle>
                <CardDescription>Term-wise fee breakdown</CardDescription>
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
    </DashboardLayout>
  );
}
