import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Plus, Download, Filter, Printer } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { GenerateInvoicesDialog } from "@/components/GenerateInvoicesDialog";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { PrintableInvoice } from "@/components/PrintableInvoice";
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
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedGradeForReport, setSelectedGradeForReport] = useState<string | undefined>(undefined);
  
  const { balances, loading: balancesLoading } = useFeeBalances({
    gradeId: selectedGradeForReport,
    academicYear: currentPeriod?.academic_year || "",
    term: currentPeriod?.term || "term_1",
  });

  // Group invoices by grade
  const groupedInvoices = useMemo(() => {
    const filtered = invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.learner?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.learner?.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.learner?.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.grade?.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      const matchesGrade = gradeFilter === "all" || invoice.grade_id === gradeFilter;

      return matchesSearch && matchesStatus && matchesGrade;
    });

    const grouped = filtered.reduce((acc: any, invoice) => {
      const gradeId = invoice.grade_id;
      if (!acc[gradeId]) {
        acc[gradeId] = {
          grade: invoice.grade,
          invoices: [],
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }
      acc[gradeId].invoices.push(invoice);
      acc[gradeId].totalAmount += Number(invoice.total_amount);
      acc[gradeId].totalPaid += Number(invoice.amount_paid);
      acc[gradeId].totalBalance += Number(invoice.balance_due);
      return acc;
    }, {});

    return Object.values(grouped);
  }, [invoices, searchQuery, statusFilter, gradeFilter]);

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
    gradeId?: string,
    streamId?: string
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

  const handlePrintGradeInvoices = (gradeInvoices: any[]) => {
    gradeInvoices.forEach((invoice, index) => {
      setTimeout(() => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const invoiceElement = document.getElementById(`printable-invoice-${invoice.id}`);
        if (invoiceElement) {
          printWindow.document.write(invoiceElement.innerHTML);
          printWindow.document.close();
          printWindow.print();
        }
      }, index * 500);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Invoice Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage learner invoices and track payments
            </p>
          </div>
          <Button onClick={() => setGenerateDialogOpen(true)} className="w-full sm:w-auto">
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
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
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
                className="w-full sm:w-auto"
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
            <CardTitle>Invoices by Grade</CardTitle>
            <CardDescription>
              View and manage invoices grouped by grade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, learner, or grade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
            ) : groupedInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedInvoices.map((group: any) => (
                  <Card key={group.grade.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg sm:text-xl">{group.grade.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between sm:justify-start sm:gap-4">
                              <span className="text-muted-foreground">Total:</span>
                              <span className="font-medium">{formatCurrency(group.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between sm:justify-start sm:gap-4">
                              <span className="text-muted-foreground">Paid:</span>
                              <span className="font-medium text-green-600">{formatCurrency(group.totalPaid)}</span>
                            </div>
                            <div className="flex justify-between sm:justify-start sm:gap-4">
                              <span className="text-muted-foreground">Balance:</span>
                              <span className="font-medium text-red-600">{formatCurrency(group.totalBalance)}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintGradeInvoices(group.invoices)}
                            className="w-full sm:w-auto"
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Print All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/30 border-b">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Invoice #</th>
                              <th className="text-left p-3 text-sm font-medium">Learner</th>
                              <th className="text-left p-3 text-sm font-medium hidden sm:table-cell">Stream</th>
                              <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Year/Term</th>
                              <th className="text-right p-3 text-sm font-medium">Amount</th>
                              <th className="text-right p-3 text-sm font-medium hidden sm:table-cell">Paid</th>
                              <th className="text-right p-3 text-sm font-medium">Balance</th>
                              <th className="text-left p-3 text-sm font-medium">Status</th>
                              <th className="text-left p-3 text-sm font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.invoices.map((invoice: any) => (
                              <tr key={invoice.id} className="border-b hover:bg-muted/50">
                                <td className="p-3 text-sm font-medium">{invoice.invoice_number}</td>
                                <td className="p-3 text-sm">
                                  <div>
                                    {invoice.learner?.first_name} {invoice.learner?.last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {invoice.learner?.admission_number}
                                  </div>
                                </td>
                                <td className="p-3 text-sm hidden sm:table-cell">
                                  {invoice.stream?.name || "-"}
                                </td>
                                <td className="p-3 text-sm hidden md:table-cell">
                                  <div>{invoice.academic_year}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {invoice.term.replace("_", " ").toUpperCase()}
                                  </div>
                                </td>
                                <td className="p-3 text-sm text-right">
                                  {formatCurrency(invoice.total_amount)}
                                </td>
                                <td className="p-3 text-sm text-right hidden sm:table-cell">
                                  {formatCurrency(invoice.amount_paid)}
                                </td>
                                <td className="p-3 text-sm text-right font-medium">
                                  {formatCurrency(invoice.balance_due)}
                                </td>
                                <td className="p-3">
                                  <Badge className={getStatusColor(invoice.status)}>
                                    {invoice.status}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleRecordPayment(invoice)}
                                      >
                                        Pay
                                      </Button>
                                    )}
                                    <PrintableInvoice invoice={invoice} />
                                  </div>
                                </td>
                                <td className="hidden">
                                  <div id={`printable-invoice-${invoice.id}`}>
                                    <PrintableInvoice invoice={invoice} />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GenerateInvoicesDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onGenerate={handleGenerateInvoices}
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
