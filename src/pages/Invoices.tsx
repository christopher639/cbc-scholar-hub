import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Plus, Download, Filter } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { GenerateInvoicesDialog } from "@/components/GenerateInvoicesDialog";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { useGrades } from "@/hooks/useGrades";
import { useFeeBalances } from "@/hooks/useFeeBalances";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { downloadFeeBalanceReport } from "@/utils/feeReportGenerator";

export default function Invoices() {
  const { invoices, loading, bulkGenerateInvoices, fetchInvoices } = useInvoices();
  const { grades } = useGrades();
  const { currentPeriod } = useAcademicPeriods();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGradeForReport, setSelectedGradeForReport] = useState<string | undefined>(undefined);
  
  const { balances, loading: balancesLoading } = useFeeBalances({
    gradeId: selectedGradeForReport,
    academicYear: currentPeriod?.academic_year || "",
    term: currentPeriod?.term || "term_1",
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.learner?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.learner?.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.learner?.admission_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      case "overdue":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const handleRecordPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleGenerateInvoices = async (
    academicYear: string,
    term: "term_1" | "term_2" | "term_3",
    gradeId?: string
  ) => {
    await bulkGenerateInvoices(academicYear, term, gradeId);
    setGenerateDialogOpen(false);
  };

  const handleDownloadBalanceReport = () => {
    if (!currentPeriod || !selectedGradeForReport) return;
    
    const selectedGrade = grades.find(g => g.id === selectedGradeForReport);
    if (!selectedGrade) return;

    downloadFeeBalanceReport(
      balances,
      selectedGrade.name,
      null,
      currentPeriod.academic_year,
      currentPeriod.term.replace("_", " ").toUpperCase()
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoice Management</h1>
            <p className="text-muted-foreground">
              Manage learner invoices and track payments
            </p>
          </div>
          <Button onClick={() => setGenerateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Invoices
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Balance Report by Grade</CardTitle>
            <CardDescription>Download a printable fee balance report for all learners in a grade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select Grade</label>
                <Select value={selectedGradeForReport} onValueChange={setSelectedGradeForReport}>
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
              <Button 
                onClick={handleDownloadBalanceReport}
                disabled={!selectedGradeForReport || balancesLoading || !currentPeriod}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Balance Report
              </Button>
            </div>
            {currentPeriod && (
              <p className="text-sm text-muted-foreground mt-2">
                Report for: {currentPeriod.academic_year} - {currentPeriod.term.replace("_", " ").toUpperCase()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>
              View and manage all generated invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, learner name, or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading invoices...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Learner</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {invoice.learner?.first_name} {invoice.learner?.last_name}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {invoice.learner?.admission_number}
                          </span>
                        </TableCell>
                        <TableCell>{invoice.grade?.name}</TableCell>
                        <TableCell>{invoice.academic_year}</TableCell>
                        <TableCell>
                          {invoice.term.replace("_", " ").toUpperCase()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(invoice.amount_paid)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.balance_due)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                              <Button
                                size="sm"
                                onClick={() => handleRecordPayment(invoice)}
                              >
                                Pay
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
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

      <GenerateInvoicesDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onGenerate={bulkGenerateInvoices}
      />

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoice={selectedInvoice}
        onSuccess={fetchInvoices}
      />
    </DashboardLayout>
  );
}
