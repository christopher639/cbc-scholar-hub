import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Filter, 
  Printer, 
  XCircle, 
  Edit, 
  Smartphone, 
  ChevronDown, 
  ChevronRight,
  Receipt,
  Wallet,
  TrendingUp,
  Clock
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { GenerateInvoicesDialog } from "@/components/GenerateInvoicesDialog";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { MpesaPaymentDialog } from "@/components/MpesaPaymentDialog";
import { SetFeeStructureDialogEnhanced } from "@/components/SetFeeStructureDialogEnhanced";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [editFeeStructureOpen, setEditFeeStructureOpen] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<any>(null);
  const [bulkCancelDialogOpen, setBulkCancelDialogOpen] = useState(false);
  const [groupToCancel, setGroupToCancel] = useState<any>(null);
  const [bulkCancelReason, setBulkCancelReason] = useState("");
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [mpesaInvoice, setMpesaInvoice] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { balances, loading: balancesLoading } = useFeeBalances({
    gradeId: selectedGradeForReport,
    academicYear: currentPeriod?.academic_year || "",
    term: currentPeriod?.term || "term_1",
  });

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

  const groupedInvoices = useMemo(() => {
    const filtered = invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.learner?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.learner?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.learner?.admission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.grade?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      const matchesGrade = gradeFilter === "all" || invoice.grade_id === gradeFilter;

      return matchesSearch && matchesStatus && matchesGrade;
    });

    const grouped = filtered.reduce((acc: any, invoice) => {
      const key = `${invoice.grade_id}-${invoice.term}-${invoice.academic_year}`;
      if (!acc[key]) {
        acc[key] = {
          grade: invoice.grade,
          term: invoice.term,
          academicYear: invoice.academic_year,
          gradeId: invoice.grade_id,
          feeStructureId: invoice.fee_structure_id,
          invoices: [],
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }
      acc[key].invoices.push(invoice);
      acc[key].totalAmount += Number(invoice.total_amount);
      acc[key].totalPaid += Number(invoice.amount_paid);
      acc[key].totalBalance += Number(invoice.balance_due);
      return acc;
    }, {});

    return Object.values(grouped);
  }, [invoices, searchQuery, statusFilter, gradeFilter]);

  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      generated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    };
    return styles[status] || styles.generated;
  };

  const handleRecordPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleMpesaPayment = (invoice: any) => {
    setMpesaInvoice(invoice);
    setMpesaDialogOpen(true);
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

  const handleEditFeeStructure = async (feeStructureId: string, gradeId: string, term: string, academicYear: string) => {
    try {
      const { data, error } = await supabase
        .from("fee_structures")
        .select(`*, fee_structure_items(*)`)
        .eq("id", feeStructureId)
        .single();

      if (error) throw error;
      
      setSelectedFeeStructure({
        ...data,
        gradeId,
        term,
        academicYear,
      });
      setEditFeeStructureOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load fee structure",
        variant: "destructive",
      });
    }
  };

  const handleBulkCancel = async () => {
    if (!groupToCancel || !bulkCancelReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    try {
      const invoiceIds = groupToCancel.invoices.map((inv: any) => inv.id);
      
      for (const invoiceId of invoiceIds) {
        await cancelInvoice(invoiceId, bulkCancelReason);
      }

      toast({
        title: "Success",
        description: `Cancelled ${invoiceIds.length} invoice(s) successfully`,
      });
      
      setBulkCancelDialogOpen(false);
      setGroupToCancel(null);
      setBulkCancelReason("");
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel invoices",
        variant: "destructive",
      });
    }
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

  const handlePrintInvoice = async (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const { data: school } = await supabase.from("school_info").select("*").single();

    const getStatusClass = (status: string) => {
      const statusMap: Record<string, string> = {
        generated: "background-color: #fef3c7; color: #92400e;",
        partial: "background-color: #dbeafe; color: #1e40af;",
        paid: "background-color: #d1fae5; color: #065f46;",
        overdue: "background-color: #fee2e2; color: #991b1b;",
        cancelled: "background-color: #f3f4f6; color: #374151;",
      };
      return statusMap[status] || statusMap.generated;
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { max-width: 80px; margin-bottom: 10px; }
            .school-name { font-size: 22px; font-weight: bold; margin: 10px 0; }
            .school-details { font-size: 12px; color: #666; }
            .invoice-title { text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
            .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; }
            .info-section { flex: 1; }
            .info-label { font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { display: flex; justify-content: flex-end; margin: 5px 0; }
            .total-label { width: 150px; font-weight: bold; }
            .total-value { width: 150px; text-align: right; }
            .grand-total { font-size: 16px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${school?.logo_url ? `<img src="${school.logo_url}" alt="Logo" class="logo" />` : ''}
            <div class="school-name">${school?.school_name || "School Name"}</div>
            <div class="school-details">
              ${school?.address ? `<div>${school.address}</div>` : ''}
              ${school?.phone ? `<div>Tel: ${school.phone}</div>` : ''}
              ${school?.email ? `<div>Email: ${school.email}</div>` : ''}
            </div>
          </div>
          <div class="invoice-title">FEE INVOICE</div>
          <div class="invoice-info">
            <div class="info-section">
              <div><span class="info-label">Invoice #:</span> ${invoice.invoice_number}</div>
              <div><span class="info-label">Issue Date:</span> ${new Date(invoice.issue_date).toLocaleDateString()}</div>
              <div><span class="info-label">Due Date:</span> ${new Date(invoice.due_date).toLocaleDateString()}</div>
              <div><span class="info-label">Status:</span> <span class="status-badge" style="${getStatusClass(invoice.status)}">${invoice.status.toUpperCase()}</span></div>
            </div>
            <div class="info-section">
              <div><span class="info-label">Learner:</span> ${invoice.learner?.first_name} ${invoice.learner?.last_name}</div>
              <div><span class="info-label">Adm. No:</span> ${invoice.learner?.admission_number}</div>
              <div><span class="info-label">Grade:</span> ${invoice.grade?.name}</div>
              <div><span class="info-label">Period:</span> ${invoice.academic_year} - ${invoice.term?.replace("_", " ").toUpperCase()}</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Item</th><th>Description</th><th style="text-align: right">Amount</th></tr></thead>
            <tbody>
              ${invoice.line_items?.map((item: any) => `
                <tr><td>${item.item_name}</td><td>${item.description || '-'}</td><td style="text-align: right">${formatCurrency(item.amount)}</td></tr>
              `).join('') || '<tr><td colspan="3">No items</td></tr>'}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row"><div class="total-label">Subtotal:</div><div class="total-value">${formatCurrency(invoice.total_amount)}</div></div>
            ${invoice.discount_amount > 0 ? `<div class="total-row"><div class="total-label">Discount:</div><div class="total-value">-${formatCurrency(invoice.discount_amount)}</div></div>` : ''}
            <div class="total-row grand-total"><div class="total-label">Total:</div><div class="total-value">${formatCurrency(invoice.total_amount - (invoice.discount_amount || 0))}</div></div>
            <div class="total-row"><div class="total-label">Paid:</div><div class="total-value">${formatCurrency(invoice.amount_paid)}</div></div>
            <div class="total-row grand-total"><div class="total-label">Balance:</div><div class="total-value">${formatCurrency(invoice.balance_due)}</div></div>
          </div>
          <div class="footer"><p>Thank you for your payment.</p><p>This is a computer-generated invoice.</p></div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
            <p className="text-muted-foreground text-sm">Manage and track learner invoices</p>
          </div>
          <Button onClick={() => setGenerateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Invoices
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Invoices (30d)</p>
              <p className="text-2xl font-bold mt-1">{recentInvoicesStats.count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-muted-foreground">Total Billed</p>
              <p className="text-lg md:text-xl font-bold mt-1">{formatCurrency(recentInvoicesStats.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">Collected</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-1">{formatCurrency(recentInvoicesStats.totalPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-1">{formatCurrency(recentInvoicesStats.totalBalance)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Report Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Download Balance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedGradeForReport} onValueChange={setSelectedGradeForReport}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleDownloadBalanceReport}
                disabled={!selectedGradeForReport || balancesLoading || !currentPeriod}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
            {currentPeriod && (
              <p className="text-xs text-muted-foreground mt-2">
                Report for: {currentPeriod.academic_year} - {currentPeriod.term.replace("_", " ").toUpperCase()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="sm:w-[150px]">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[150px]">
                  <SelectValue placeholder="Status" />
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

            {/* Invoice Groups */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
            ) : groupedInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-3 opacity-40" />
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedInvoices.map((group: any) => {
                  const groupKey = `${group.gradeId}-${group.term}-${group.academicYear}`;
                  const isExpanded = expandedGroups.has(groupKey);

                  return (
                    <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroupExpansion(groupKey)}>
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <div>
                                <div className="font-medium">{group.grade?.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {group.term?.replace("term_", "Term ")} • {group.academicYear} • {group.invoices.length} invoice(s)
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="hidden sm:block text-right">
                                <div className="text-muted-foreground text-xs">Balance</div>
                                <div className="font-semibold text-red-600">{formatCurrency(group.totalBalance)}</div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFeeStructure(group.feeStructureId, group.gradeId, group.term, group.academicYear);
                                  }}
                                  title="Edit Fee Structure"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGroupToCancel(group);
                                    setBulkCancelDialogOpen(true);
                                  }}
                                  title="Cancel All"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Invoice #</TableHead>
                                  <TableHead>Learner</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                  <TableHead className="text-right">Paid</TableHead>
                                  <TableHead className="text-right">Balance</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.invoices.map((invoice: any) => (
                                  <TableRow key={invoice.id}>
                                    <TableCell className="font-mono text-xs">{invoice.invoice_number}</TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{invoice.learner?.first_name} {invoice.learner?.last_name}</div>
                                        <div className="text-xs text-muted-foreground">{invoice.learner?.admission_number}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(invoice.amount_paid)}</TableCell>
                                    <TableCell className="text-right text-red-600">{formatCurrency(invoice.balance_due)}</TableCell>
                                    <TableCell>
                                      <Badge className={getStatusBadge(invoice.status)} variant="secondary">
                                        {invoice.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center justify-end gap-1">
                                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => handleRecordPayment(invoice)}
                                              title="Record Payment"
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-green-600 hover:text-green-700"
                                              onClick={() => handleMpesaPayment(invoice)}
                                              title="Pay via M-Pesa"
                                            >
                                              <Smartphone className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handlePrintInvoice(invoice)}
                                          title="Print Invoice"
                                        >
                                          <Printer className="h-4 w-4" />
                                        </Button>
                                        {invoice.status !== 'cancelled' && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleCancelInvoice(invoice)}
                                            title="Cancel Invoice"
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
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

      <SetFeeStructureDialogEnhanced
        open={editFeeStructureOpen}
        onOpenChange={setEditFeeStructureOpen}
        existingStructure={selectedFeeStructure}
        onSuccess={() => {
          setEditFeeStructureOpen(false);
          fetchInvoices();
        }}
      />

      <MpesaPaymentDialog
        open={mpesaDialogOpen}
        onOpenChange={setMpesaDialogOpen}
        learnerId={mpesaInvoice?.learner_id}
        learnerName={mpesaInvoice?.learner ? `${mpesaInvoice.learner.first_name} ${mpesaInvoice.learner.last_name}` : ""}
        admissionNumber={mpesaInvoice?.learner?.admission_number}
        invoiceId={mpesaInvoice?.id}
        amount={mpesaInvoice?.balance_due}
        onSuccess={fetchInvoices}
      />

      {/* Bulk Cancel Dialog */}
      <AlertDialog open={bulkCancelDialogOpen} onOpenChange={setBulkCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel All Invoices</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel all {groupToCancel?.invoices.length} invoices for {groupToCancel?.grade?.name}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-cancel-reason">Reason</Label>
            <Textarea
              id="bulk-cancel-reason"
              placeholder="Enter reason..."
              value={bulkCancelReason}
              onChange={(e) => setBulkCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBulkCancelDialogOpen(false);
              setGroupToCancel(null);
              setBulkCancelReason("");
            }}>
              Keep
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel invoice {invoiceToCancel?.invoice_number}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancelReason">Reason *</Label>
            <Textarea
              id="cancelReason"
              placeholder="Enter reason..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCancelReason("");
              setInvoiceToCancel(null);
            }}>
              Keep
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
    </DashboardLayout>
  );
}
