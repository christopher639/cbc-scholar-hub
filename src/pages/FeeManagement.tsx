import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, AlertCircle, Download, Plus, Calendar, Receipt, Wallet, Clock, FileText, Search, Printer, XCircle, Smartphone, ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeePayments } from "@/hooks/useFeePayments";
import { useFeeStats } from "@/hooks/useFeeStats";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import { useLearners } from "@/hooks/useLearners";
import { useInvoices } from "@/hooks/useInvoices";
import { useTransactions } from "@/hooks/useTransactions";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useGrades } from "@/hooks/useGrades";
import { useFeeBalances } from "@/hooks/useFeeBalances";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { GenerateInvoicesDialog } from "@/components/GenerateInvoicesDialog";
import { MpesaPaymentDialog } from "@/components/MpesaPaymentDialog";
import { SetFeeStructureDialogEnhanced } from "@/components/SetFeeStructureDialogEnhanced";
import { FeeStructureDocumentPreview } from "@/components/FeeStructureDocumentPreview";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { downloadFeeBalanceReport } from "@/utils/feeReportGenerator";
import { generateFeeStructurePDF } from "@/utils/feeStructurePdfGenerator";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const FeeManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const { payments, loading: paymentsLoading, fetchPayments } = useFeePayments();
  const { stats, trendData, loading: statsLoading, fetchStats } = useFeeStats(dateRange.start, dateRange.end);
  const { structures, loading: structuresLoading } = useFeeStructures();
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  // Invoices state
  const { invoices, loading: invoicesLoading, bulkGenerateInvoices, cancelInvoice, fetchInvoices } = useInvoices();
  const { grades } = useGrades();
  const { currentPeriod } = useAcademicPeriods();
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
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [mpesaInvoice, setMpesaInvoice] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [structureYearFilter, setStructureYearFilter] = useState("all");
  const [structureGradeFilter, setStructureGradeFilter] = useState("all");

  // Learner Fees state
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>("");
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const { learners, loading: learnersLoading } = useLearners();
  const { invoices: learnerInvoices, loading: learnerInvoicesLoading } = useInvoices(selectedLearnerId);
  const { transactions, loading: transactionsLoading } = useTransactions(undefined, selectedLearnerId);
  const selectedLearner = learners.find(l => l.id === selectedLearnerId);

  const { balances, loading: balancesLoading } = useFeeBalances({
    gradeId: selectedGradeForReport,
    academicYear: currentPeriod?.academic_year || "",
    term: currentPeriod?.term || "term_1",
  });

  // Fetch fee_payments for selected learner
  useEffect(() => {
    const fetchLearnerFeePayments = async () => {
      if (!selectedLearnerId) {
        setFeePayments([]);
        return;
      }
      
      const { data } = await supabase
        .from("fee_payments")
        .select(`*, fee_structure:fee_structures(academic_year, term)`)
        .eq("learner_id", selectedLearnerId)
        .order("payment_date", { ascending: false });
      
      setFeePayments(data || []);
    };
    
    fetchLearnerFeePayments();
  }, [selectedLearnerId]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handlePaymentSuccess = () => {
    fetchPayments();
    fetchStats();
    fetchInvoices();
  };

  // Invoice helpers
  const recentInvoicesStats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentInvoices = invoices.filter((inv) => new Date(inv.created_at) >= thirtyDaysAgo);
    
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

  // Learner fees calculations
  const currentTermInvoice = learnerInvoices.find(
    inv => inv.academic_year === currentPeriod?.academic_year && inv.term === currentPeriod?.term
  );

  const currentTermTransactions = transactions.filter(
    t => t.invoice?.academic_year === currentPeriod?.academic_year && t.invoice?.term === currentPeriod?.term
  );
  
  const currentTermFeePayments = feePayments.filter(
    p => p.fee_structure?.academic_year === currentPeriod?.academic_year && p.fee_structure?.term === currentPeriod?.term
  );
  
  const currentTermPaid = currentTermTransactions.reduce((sum, t) => sum + Number(t.amount_paid), 0) +
                          currentTermFeePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const currentTermBalance = currentTermInvoice ? Number(currentTermInvoice.total_amount) - currentTermPaid : 0;

  const learnerTotalDue = learnerInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const learnerTotalPaid = transactions.reduce((sum, t) => sum + Number(t.amount_paid), 0) +
                           feePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const learnerOverallBalance = learnerTotalDue - learnerTotalPaid;

  // Fee structure helpers
  const uniqueAcademicYears = useMemo(() => {
    const years = new Set(structures.map(s => s.academic_year));
    return Array.from(years).sort().reverse();
  }, [structures]);

  const filteredStructures = useMemo(() => {
    return structures.filter(s => 
      s.academic_year === structureYearFilter && 
      s.grade_id === structureGradeFilter
    );
  }, [structures, structureYearFilter, structureGradeFilter]);

  const handleDownloadFeeStructure = () => {
    const gradeName = grades.find(g => g.id === structureGradeFilter)?.name || "";
    generateFeeStructurePDF(filteredStructures, structureYearFilter, gradeName);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Finance</h1>
              <p className="text-sm text-muted-foreground">Manage fees & invoices</p>
            </div>
            
            {/* Inline Stats */}
            <div className="hidden xl:flex items-center gap-4 ml-4 pl-4 border-l">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-sm font-semibold">{statsLoading ? "..." : formatCurrency(stats?.totalCollected || 0)}</p>
              </div>
            </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-500/10 rounded">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-sm font-semibold">{statsLoading ? "..." : formatCurrency(stats?.outstanding || 0)}</p>
              </div>
            </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                </div>
              <div>
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="text-sm font-semibold">{statsLoading ? "..." : `${(stats?.collectionRate || 0).toFixed(0)}%`}</p>
              </div>
            </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">
                    {dateRange.start && dateRange.end
                      ? `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d")}`
                      : "Date Range"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-2">Start Date</p>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => setDateRange({ ...dateRange, start: date })}
                      className="pointer-events-auto"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">End Date</p>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                      disabled={(date) => dateRange.start ? date < dateRange.start : false}
                      className="pointer-events-auto"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setDateRange({})}>
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setRecordPaymentOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Payment</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs h-7">Overview</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs h-7">Invoices</TabsTrigger>
            <TabsTrigger value="learner" className="text-xs h-7">Learner Fees</TabsTrigger>
            <TabsTrigger value="structures" className="text-xs h-7">Structures</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-3">
            {/* Mobile Stats */}
            <div className="grid gap-2 grid-cols-3 xl:hidden">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Collected</p>
                    <p className="text-sm font-bold">{statsLoading ? "..." : formatCurrency(stats?.totalCollected || 0)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="text-sm font-bold">{statsLoading ? "..." : formatCurrency(stats?.outstanding || 0)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="text-sm font-bold">{statsLoading ? "..." : `${(stats?.collectionRate || 0).toFixed(0)}%`}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Two Column Layout for Large Screens */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Chart */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Payment Trend</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {statsLoading ? (
                    <Skeleton className="h-[180px] w-full" />
                  ) : trendData.length === 0 ? (
                    <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                      No data available
                    </div>
                  ) : (
                    <ChartContainer config={{ amount: { label: "Amount", color: "hsl(var(--success))" } }} className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "MMM dd")} className="text-xs" />
                          <YAxis tickFormatter={(value) => formatCurrency(value).replace('.00', '')} className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => format(new Date(value), "PPP")} formatter={(value) => formatCurrency(Number(value))} />} />
                          <Line type="monotone" dataKey="amount" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {paymentsLoading ? (
                    <div className="px-4 pb-4 space-y-2">
                      {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-10 w-full" />))}
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <p className="text-muted-foreground text-sm mb-2">No payments yet</p>
                      <Button size="sm" onClick={() => setRecordPaymentOpen(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Record Payment
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="py-2 text-xs">Admission</TableHead>
                          <TableHead className="py-2 text-xs">Name</TableHead>
                          <TableHead className="py-2 text-xs hidden md:table-cell">Grade</TableHead>
                          <TableHead className="py-2 text-xs text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.slice(0, 5).map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="py-2 text-xs font-mono">{payment.learner?.admission_number || 'N/A'}</TableCell>
                            <TableCell className="py-2 text-xs">{payment.learner?.first_name} {payment.learner?.last_name}</TableCell>
                            <TableCell className="py-2 text-xs hidden md:table-cell">{payment.learner?.current_grade?.name || 'N/A'}</TableCell>
                            <TableCell className="py-2 text-xs text-right font-medium">{formatCurrency(Number(payment.amount_paid))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-3 mt-3">
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-7 h-8 text-xs" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[90px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[90px] h-8 text-xs">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {grades.map((grade) => (<SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="h-8" onClick={() => setGenerateDialogOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Generate
              </Button>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Receipt, label: "Invoices", value: recentInvoicesStats.count },
                { icon: TrendingUp, label: "Billed", value: formatCurrency(recentInvoicesStats.totalAmount) },
                { icon: Wallet, label: "Collected", value: formatCurrency(recentInvoicesStats.totalPaid) },
                { icon: Clock, label: "Outstanding", value: formatCurrency(recentInvoicesStats.totalBalance) },
              ].map((stat) => (
                <Card key={stat.label} className="p-2">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-3.5 w-3.5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      <p className="text-xs font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Invoice Groups */}
            {invoicesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-14 w-full" />))}
              </div>
            ) : groupedInvoices.length === 0 ? (
              <Card className="py-8 text-center">
                <p className="text-muted-foreground text-sm">No invoices found</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {groupedInvoices.map((group: any) => {
                  const groupKey = `${group.gradeId}-${group.term}-${group.academicYear}`;
                  const isExpanded = expandedGroups.has(groupKey);
                  
                  return (
                    <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroupExpansion(groupKey)}>
                      <Card>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <div>
                                <p className="text-sm font-medium">{group.grade?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {group.term?.replace("_", " ").toUpperCase()} • {group.academicYear} • {group.invoices.length} invoices
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(group.totalBalance)}</p>
                              <p className="text-[10px] text-muted-foreground">Balance</p>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead className="py-2 text-xs">Invoice #</TableHead>
                                  <TableHead className="py-2 text-xs">Learner</TableHead>
                                  <TableHead className="py-2 text-xs text-right">Total</TableHead>
                                  <TableHead className="py-2 text-xs text-right">Balance</TableHead>
                                  <TableHead className="py-2 text-xs">Status</TableHead>
                                  <TableHead className="py-2 text-xs w-8"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.invoices.map((invoice: any) => (
                                  <TableRow key={invoice.id}>
                                    <TableCell className="py-2 text-xs font-mono">{invoice.invoice_number}</TableCell>
                                    <TableCell className="py-2 text-xs">{invoice.learner?.first_name} {invoice.learner?.last_name}</TableCell>
                                    <TableCell className="py-2 text-xs text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                                    <TableCell className="py-2 text-xs text-right font-medium">{formatCurrency(invoice.balance_due)}</TableCell>
                                    <TableCell className="py-2">
                                      <Badge className={cn("text-[10px] px-1.5 py-0", getStatusBadge(invoice.status))}>{invoice.status}</Badge>
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                                            <Download className="h-3 w-3 mr-2" />Download
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                                            <Printer className="h-3 w-3 mr-2" />Print
                                          </DropdownMenuItem>
                                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                            <>
                                              <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                                                <DollarSign className="h-3 w-3 mr-2" />Record Payment
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleMpesaPayment(invoice)}>
                                                <Smartphone className="h-3 w-3 mr-2" />M-Pesa
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleCancelInvoice(invoice)} className="text-destructive">
                                                <XCircle className="h-3 w-3 mr-2" />Cancel
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Learner Fees Tab */}
          <TabsContent value="learner" className="space-y-3 mt-3">
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <Label className="text-sm whitespace-nowrap">Select Learner</Label>
                <Select value={selectedLearnerId} onValueChange={setSelectedLearnerId}>
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue placeholder="Search learner..." />
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
            </Card>

            {selectedLearnerId && selectedLearner && (
              <>
                {/* Learner Info */}
                <Card className="p-3">
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedLearner.first_name} {selectedLearner.last_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Admission</p>
                      <p className="font-medium">{selectedLearner.admission_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Grade</p>
                      <p className="font-medium">{selectedLearner.current_grade?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Year</p>
                      <p className="font-medium">{currentPeriod?.academic_year || "N/A"}</p>
                    </div>
                  </div>
                </Card>

                {/* Financial Summary */}
                <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                  {[
                    { label: "Current Term Balance", value: formatCurrency(Math.abs(currentTermBalance)) },
                    { label: "Overall Balance", value: formatCurrency(Math.abs(learnerOverallBalance)) },
                    { label: "Total Paid", value: formatCurrency(learnerTotalPaid) },
                    { label: "Total Fees", value: formatCurrency(learnerTotalDue) },
                  ].map((item) => (
                    <Card key={item.label} className="p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-base font-semibold">{item.value}</p>
                    </Card>
                  ))}
                </div>

                {/* Two Column Layout */}
                <div className="grid gap-3 lg:grid-cols-2">
                  {/* Invoices */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium">Fee Invoices</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      {learnerInvoicesLoading ? (
                        <p className="text-xs text-muted-foreground px-3 pb-3">Loading...</p>
                      ) : learnerInvoices.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-3 pb-3">No invoices found</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="py-1.5 text-xs">Invoice</TableHead>
                              <TableHead className="py-1.5 text-xs">Term</TableHead>
                              <TableHead className="py-1.5 text-xs text-right">Balance</TableHead>
                              <TableHead className="py-1.5 text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {learnerInvoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell className="py-1.5 text-xs font-mono">{invoice.invoice_number}</TableCell>
                                <TableCell className="py-1.5 text-xs">{invoice.term.replace("_", " ").toUpperCase()}</TableCell>
                                <TableCell className="py-1.5 text-xs text-right">{formatCurrency(Number(invoice.balance_due))}</TableCell>
                                <TableCell className="py-1.5">
                                  <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
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
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      {transactionsLoading ? (
                        <p className="text-xs text-muted-foreground px-3 pb-3">Loading...</p>
                      ) : transactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-3 pb-3">No payments recorded</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="py-1.5 text-xs">Trans #</TableHead>
                              <TableHead className="py-1.5 text-xs">Date</TableHead>
                              <TableHead className="py-1.5 text-xs text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="py-1.5 text-xs font-mono">{transaction.transaction_number}</TableCell>
                                <TableCell className="py-1.5 text-xs">{format(new Date(transaction.payment_date), "MMM dd")}</TableCell>
                                <TableCell className="py-1.5 text-xs text-right font-medium">{formatCurrency(Number(transaction.amount_paid))}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Fee Structures Tab */}
          <TabsContent value="structures" className="space-y-3 mt-3">
            <Card className="p-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Year</Label>
                    <Select value={structureYearFilter} onValueChange={setStructureYearFilter}>
                      <SelectTrigger className="h-8 w-[100px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueAcademicYears.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Grade</Label>
                    <Select value={structureGradeFilter} onValueChange={setStructureGradeFilter}>
                      <SelectTrigger className="h-8 w-[100px]">
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (<SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="h-8" onClick={() => setEditFeeStructureOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create
                </Button>
              </div>
            </Card>

            {structureYearFilter && structureYearFilter !== "all" && structureGradeFilter && structureGradeFilter !== "all" ? (
              <FeeStructureDocumentPreview
                structures={filteredStructures}
                academicYear={structureYearFilter}
                gradeName={grades.find(g => g.id === structureGradeFilter)?.name || ""}
                loading={structuresLoading}
                onDownload={handleDownloadFeeStructure}
              />
            ) : (
              <Card className="py-10 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select year and grade to view fee structure</p>
              </Card>
            )}

            <SetFeeStructureDialogEnhanced open={editFeeStructureOpen} onOpenChange={setEditFeeStructureOpen} />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <RecordPaymentDialog
          open={recordPaymentOpen || paymentDialogOpen}
          onOpenChange={(open) => { setRecordPaymentOpen(open); setPaymentDialogOpen(open); }}
          onSuccess={handlePaymentSuccess}
        />

        <GenerateInvoicesDialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen} onGenerate={handleGenerateInvoices} />

        <MpesaPaymentDialog
          open={mpesaDialogOpen}
          onOpenChange={setMpesaDialogOpen}
          invoiceId={mpesaInvoice?.id}
          learnerId={mpesaInvoice?.learner_id}
          amount={mpesaInvoice?.balance_due}
        />

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
              <AlertDialogDescription>Cancel invoice {invoiceToCancel?.invoice_number}?</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Enter reason..." />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancelInvoice}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default FeeManagement;