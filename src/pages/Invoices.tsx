import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Plus, Download, Filter, Printer, XCircle } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Invoices() {
  const { invoices, loading, bulkGenerateInvoices, cancelInvoice, fetchInvoices } = useInvoices();
  const { grades } = useGrades();
  const { currentPeriod } = useAcademicPeriods();
  const { toast } = useToast();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedGradeForReport, setSelectedGradeForReport] = useState<string | undefined>(undefined);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  
  const { balances, loading: balancesLoading } = useFeeBalances({
    gradeId: selectedGradeForReport,
    academicYear: currentPeriod?.academic_year || "",
    term: currentPeriod?.term || "term_1",
  });

  // Calculate stats for recently generated invoices (last 30 days)
  const recentInvoicesStats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentInvoices = invoices.filter(
      (inv) => new Date(inv.created_at) >= thirtyDaysAgo
    );
    
    return {
      count: recentInvoices.length,
      totalAmount: recentInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0),
      totalPaid: recentInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0),
      totalBalance: recentInvoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0),
    };
  }, [invoices]);

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

  const handleCancelInvoice = (invoice: any) => {
    setInvoiceToCancel(invoice);
    setCancelDialogOpen(true);
  };

  const confirmCancelInvoice = async () => {
    if (!invoiceToCancel || !cancelReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    try {
      await cancelInvoice(invoiceToCancel.id, cancelReason);
      setCancelDialogOpen(false);
      setInvoiceToCancel(null);
      setCancelReason("");
      fetchInvoices();
    } catch (error) {
      console.error("Error cancelling invoice:", error);
    }
  };

  const handlePrintGradeInvoices = async (gradeInvoices: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build the complete HTML document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Grade Invoices</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .logo {
              max-width: 100px;
              margin-bottom: 10px;
            }
            .school-name {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .school-details {
              font-size: 12px;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
            }
            .info-section {
              flex: 1;
            }
            .info-label {
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              margin: 5px 0;
              font-size: 14px;
            }
            .total-label {
              width: 150px;
              font-weight: bold;
            }
            .total-value {
              width: 150px;
              text-align: right;
            }
            .grand-total {
              font-size: 18px;
              border-top: 2px solid #333;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-generated { background-color: #fef3c7; color: #92400e; }
            .status-partial { background-color: #dbeafe; color: #1e40af; }
            .status-paid { background-color: #d1fae5; color: #065f46; }
            .status-overdue { background-color: #fee2e2; color: #991b1b; }
            .status-cancelled { background-color: #f3f4f6; color: #374151; }
            .page-break {
              page-break-after: always;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
    `);

    // Get school info from the first rendered component
    const schoolInfo = await supabase.from("school_info").select("*").single();
    const school = schoolInfo.data;

    // Render each invoice
    gradeInvoices.forEach((invoice, index) => {
      const getStatusClass = (status: string) => {
        const statusMap: Record<string, string> = {
          generated: "status-generated",
          partial: "status-partial",
          paid: "status-paid",
          overdue: "status-overdue",
          cancelled: "status-cancelled",
        };
        return statusMap[status] || "status-generated";
      };

      printWindow.document.write(`
        <div>
          <div class="header">
            ${school?.logo_url ? `<img src="${school.logo_url}" alt="School Logo" class="logo" />` : ''}
            <div class="school-name">${school?.school_name || "School Name"}</div>
            <div class="school-details">
              ${school?.address ? `<div>${school.address}</div>` : ''}
              ${school?.phone ? `<div>Tel: ${school.phone}</div>` : ''}
              ${school?.email ? `<div>Email: ${school.email}</div>` : ''}
              ${school?.motto ? `<div style="font-style: italic; margin-top: 5px">${school.motto}</div>` : ''}
            </div>
          </div>

          <h2 style="text-align: center; margin: 20px 0">FEE INVOICE</h2>

          <div class="invoice-info">
            <div class="info-section">
              <div style="margin-bottom: 8px">
                <span class="info-label">Invoice Number:</span> ${invoice.invoice_number}
              </div>
              <div style="margin-bottom: 8px">
                <span class="info-label">Issue Date:</span> ${new Date(invoice.issue_date).toLocaleDateString()}
              </div>
              <div style="margin-bottom: 8px">
                <span class="info-label">Due Date:</span> ${new Date(invoice.due_date).toLocaleDateString()}
              </div>
              <div>
                <span class="info-label">Status:</span>
                <span class="status-badge ${getStatusClass(invoice.status)}">
                  ${invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div class="info-section">
              <div style="margin-bottom: 8px">
                <span class="info-label">Learner:</span> ${invoice.learner?.first_name} ${invoice.learner?.last_name}
              </div>
              <div style="margin-bottom: 8px">
                <span class="info-label">Admission No:</span> ${invoice.learner?.admission_number}
              </div>
              <div style="margin-bottom: 8px">
                <span class="info-label">Grade:</span> ${invoice.grade?.name}
              </div>
              <div style="margin-bottom: 8px">
                <span class="info-label">Stream:</span> ${invoice.stream?.name || 'N/A'}
              </div>
              <div>
                <span class="info-label">Academic Period:</span> ${invoice.academic_year} - ${invoice.term?.replace("_", " ").toUpperCase()}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.invoice_line_items?.map((item: any) => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.description || '-'}</td>
                  <td style="text-align: right">${formatCurrency(item.amount)}</td>
                </tr>
              `).join('') || '<tr><td colspan="3">No items</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <div class="total-label">Subtotal:</div>
              <div class="total-value">${formatCurrency(invoice.total_amount)}</div>
            </div>
            ${invoice.discount_amount > 0 ? `
              <div class="total-row">
                <div class="total-label">Discount:</div>
                <div class="total-value">-${formatCurrency(invoice.discount_amount)}</div>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <div class="total-label">Total Amount:</div>
              <div class="total-value">${formatCurrency(invoice.total_amount - (invoice.discount_amount || 0))}</div>
            </div>
            <div class="total-row">
              <div class="total-label">Amount Paid:</div>
              <div class="total-value">${formatCurrency(invoice.amount_paid)}</div>
            </div>
            <div class="total-row grand-total">
              <div class="total-label">Balance Due:</div>
              <div class="total-value">${formatCurrency(invoice.balance_due)}</div>
            </div>
          </div>

          ${invoice.notes ? `
            <div style="margin-top: 20px; padding: 10px; background-color: #f9fafb; border-left: 3px solid #6366f1;">
              <strong>Notes:</strong> ${invoice.notes}
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for your payment.</p>
            <p>This is a computer-generated invoice.</p>
          </div>
        </div>
        ${index < gradeInvoices.length - 1 ? '<div class="page-break"></div>' : ''}
      `);
    });

    printWindow.document.write(`
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for images and content to load before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full w-full">
        <div className="flex-none px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b bg-background">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Invoice Management</h1>
              <p className="text-muted-foreground text-sm">
                Manage learner invoices and track payments
              </p>
            </div>
            <Button onClick={() => setGenerateDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Generate Invoices
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recent Invoices (30 days)</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{recentInvoicesStats.count}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recent Total Amount</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">
                {formatCurrency(recentInvoicesStats.totalAmount)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recent Paid</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-green-600">
                {formatCurrency(recentInvoicesStats.totalPaid)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recent Outstanding</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-red-600">
                {formatCurrency(recentInvoicesStats.totalBalance)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

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

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel invoice {invoiceToCancel?.invoice_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
              <Textarea
                id="cancelReason"
                placeholder="Enter the reason for cancelling this invoice..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCancelReason("");
              setInvoiceToCancel(null);
            }}>
              Keep Invoice
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
