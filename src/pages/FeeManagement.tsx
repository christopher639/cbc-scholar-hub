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
import { DollarSign, TrendingUp, AlertCircle, Download, Plus, Calendar, Receipt, Wallet, Clock, FileText, Search, Printer, XCircle, Smartphone, ChevronDown, ChevronRight, Send, MessageSquare } from "lucide-react";
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
  const [bulkCancelDialogOpen, setBulkCancelDialogOpen] = useState(false);
  const [groupToCancel, setGroupToCancel] = useState<any>(null);
  const [bulkCancelReason, setBulkCancelReason] = useState("");
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
        .select(`
          *,
          fee_structure:fee_structures(academic_year, term)
        `)
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

  const feeStats = [
    { 
      label: "Total Collected", 
      value: statsLoading ? "..." : formatCurrency(stats.totalCollected),
      icon: DollarSign 
    },
    { 
      label: "Outstanding", 
      value: statsLoading ? "..." : formatCurrency(stats.outstanding),
      icon: AlertCircle 
    },
    { 
      label: "Collection Rate", 
      value: statsLoading ? "..." : `${stats.collectionRate.toFixed(0)}%`,
      icon: TrendingUp 
    },
  ];

  // Invoice helpers
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

  const totalPaidFromTransactions = transactions.reduce((sum, t) => sum + Number(t.amount_paid), 0);
  const totalPaidFromFeePayments = feePayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const learnerTotalPaid = totalPaidFromTransactions + totalPaidFromFeePayments;
  
  const learnerTotalDue = learnerInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const learnerOverallBalance = learnerTotalDue - learnerTotalPaid;

  // Fee structure filtering and download
  const uniqueAcademicYears = useMemo(() => {
    const years = new Set(structures.map((s) => s.academic_year));
    return Array.from(years).sort().reverse();
  }, [structures]);

  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      const matchesYear = structureYearFilter === "all" || s.academic_year === structureYearFilter;
      const matchesGrade = structureGradeFilter === "all" || s.grade_id === structureGradeFilter;
      return matchesYear && matchesGrade;
    });
  }, [structures, structureYearFilter, structureGradeFilter]);

  const handleDownloadFeeStructure = async () => {
    try {
      const { data: school } = await supabase.from("school_info").select("*").single();
      
      const academicYear = structureYearFilter !== "all" 
        ? structureYearFilter 
        : (currentPeriod?.academic_year || new Date().getFullYear().toString());
      
      const gradeName = structureGradeFilter !== "all" 
        ? grades.find((g) => g.id === structureGradeFilter)?.name 
        : undefined;

      await generateFeeStructurePDF(
        filteredStructures,
        school,
        academicYear,
        gradeName
      );

      toast({
        title: "Downloaded",
        description: "Fee structure PDF has been downloaded",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Finance</h1>
            <p className="text-sm text-muted-foreground">Manage fees, invoices, and payments</p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="invoices" className="text-sm py-2">Invoices</TabsTrigger>
            <TabsTrigger value="learner-fees" className="text-sm py-2">Learner Fees</TabsTrigger>
            <TabsTrigger value="structures" className="text-sm py-2">Fee Structures</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex gap-2 flex-wrap justify-end">
              {/* Link to Fee Automation on Communication page */}
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2" 
                onClick={() => navigate("/communication?tab=automation")}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Fee Automation</span>
                <span className="sm:hidden">Automation</span>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {dateRange.start && dateRange.end
                        ? `${format(dateRange.start, "PP")} - ${format(dateRange.end, "PP")}`
                        : "Filter by Date"}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setDateRange({})}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button size="sm" className="gap-2" onClick={() => setRecordPaymentOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Record Payment</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-3 grid-cols-3">
              {feeStats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 sm:p-5 flex items-center gap-3 min-h-[80px]">
                    <div className="p-2 bg-primary/10 rounded-full shrink-0 hidden sm:flex">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-sm sm:text-lg font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Fee Payment Trend Graph */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Fee Payment Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : trendData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    No payment data available
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      amount: {
                        label: "Amount",
                        color: "hsl(var(--success))",
                      },
                    }}
                    className="h-[200px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), "MMM dd")}
                          className="text-xs"
                        />
                        <YAxis
                          tickFormatter={(value) => formatCurrency(value).replace('.00', '')}
                          className="text-xs"
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(value) => format(new Date(value), "PPP")}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--success))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-2">No payments recorded yet</p>
                    <Button size="sm" onClick={() => setRecordPaymentOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Record First Payment
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Admission</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Grade</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.slice(0, 5).map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-xs font-mono">
                              {payment.learner?.admission_number || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {payment.learner?.first_name} {payment.learner?.last_name}
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell">
                              {payment.learner?.current_grade?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">
                              {formatCurrency(Number(payment.amount_paid))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[150px]">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[100px] h-9 text-sm">
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
                  <SelectTrigger className="w-[100px] h-9 text-sm">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => setGenerateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Invoices (30d)</p>
                    <p className="text-lg font-bold">{recentInvoicesStats.count}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Billed</p>
                    <p className="text-sm font-bold">{formatCurrency(recentInvoicesStats.totalAmount)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collected</p>
                    <p className="text-sm font-bold">{formatCurrency(recentInvoicesStats.totalPaid)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="text-sm font-bold">{formatCurrency(recentInvoicesStats.totalBalance)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Groups */}
            {invoicesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : groupedInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No invoices found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {groupedInvoices.map((group: any) => {
                  const groupKey = `${group.gradeId}-${group.term}-${group.academicYear}`;
                  const isExpanded = expandedGroups.has(groupKey);
                  
                  return (
                    <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroupExpansion(groupKey)}>
                      <Card>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <div>
                                  <p className="font-semibold text-sm">{group.grade?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {group.term?.replace("_", " ").toUpperCase()} - {group.academicYear} • {group.invoices.length} invoices
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">{formatCurrency(group.totalBalance)}</p>
                                <p className="text-xs text-muted-foreground">Balance</p>
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Invoice #</TableHead>
                                    <TableHead className="text-xs">Learner</TableHead>
                                    <TableHead className="text-xs text-right">Total</TableHead>
                                    <TableHead className="text-xs text-right">Balance</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.invoices.map((invoice: any) => (
                                    <TableRow key={invoice.id}>
                                      <TableCell className="text-xs font-mono">{invoice.invoice_number}</TableCell>
                                      <TableCell className="text-xs">
                                        {invoice.learner?.first_name} {invoice.learner?.last_name}
                                      </TableCell>
                                      <TableCell className="text-xs text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                                      <TableCell className="text-xs text-right font-medium">{formatCurrency(invoice.balance_due)}</TableCell>
                                      <TableCell>
                                        <Badge className={cn("text-xs", getStatusBadge(invoice.status))}>
                                          {invoice.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrintInvoice(invoice)}>
                                            <Printer className="h-3 w-3" />
                                          </Button>
                                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRecordPayment(invoice)}>
                                              <DollarSign className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Learner Fees Tab */}
          <TabsContent value="learner-fees" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Select Learner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md">
                  <Select value={selectedLearnerId} onValueChange={setSelectedLearnerId}>
                    <SelectTrigger className="h-9">
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
                  <CardContent className="py-3">
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedLearner.first_name} {selectedLearner.last_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Admission Number</p>
                        <p className="font-medium">{selectedLearner.admission_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Grade</p>
                        <p className="font-medium">{selectedLearner.current_grade?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Academic Year</p>
                        <p className="font-medium">{currentPeriod?.academic_year || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Current Term Balance</p>
                      <p className="text-lg font-bold">{formatCurrency(Math.abs(currentTermBalance))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Overall Balance</p>
                      <p className="text-lg font-bold">{formatCurrency(Math.abs(learnerOverallBalance))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-bold">{formatCurrency(learnerTotalPaid)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Total Fees</p>
                      <p className="text-lg font-bold">{formatCurrency(learnerTotalDue)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Invoices */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Fee Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {learnerInvoicesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : learnerInvoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No invoices found</p>
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Invoice #</TableHead>
                              <TableHead className="text-xs">Term</TableHead>
                              <TableHead className="text-xs text-right">Total</TableHead>
                              <TableHead className="text-xs text-right">Balance</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {learnerInvoices.map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell className="text-xs font-mono">{invoice.invoice_number}</TableCell>
                                <TableCell className="text-xs">{invoice.term.replace("_", " ").toUpperCase()}</TableCell>
                                <TableCell className="text-xs text-right">{formatCurrency(Number(invoice.total_amount))}</TableCell>
                                <TableCell className="text-xs text-right font-medium">{formatCurrency(Number(invoice.balance_due))}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    invoice.status === 'paid' ? 'default' :
                                    invoice.status === 'partial' ? 'secondary' :
                                    invoice.status === 'overdue' ? 'destructive' :
                                    'outline'
                                  } className="text-xs">
                                    {invoice.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment History */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payments recorded</p>
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Transaction #</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">Method</TableHead>
                              <TableHead className="text-xs text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="text-xs font-mono">{transaction.transaction_number}</TableCell>
                                <TableCell className="text-xs">{format(new Date(transaction.payment_date), "MMM dd, yyyy")}</TableCell>
                                <TableCell className="text-xs capitalize">{transaction.payment_method}</TableCell>
                                <TableCell className="text-xs text-right font-medium">
                                  {formatCurrency(Number(transaction.amount_paid))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Fee Structures Tab */}
          <TabsContent value="structures" className="space-y-4">
            {/* Filter Bar */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <CardTitle className="text-lg font-semibold">Fee Structure</CardTitle>
                    <CardDescription className="text-sm">Select academic year and grade to view fee structure</CardDescription>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => setEditFeeStructureOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create Fee Structure
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Academic Year</Label>
                    <Select value={structureYearFilter} onValueChange={setStructureYearFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueAcademicYears.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Grade</Label>
                    <Select value={structureGradeFilter} onValueChange={setStructureGradeFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Structure Document Preview */}
            {structureYearFilter && structureYearFilter !== "all" && structureGradeFilter && structureGradeFilter !== "all" ? (
              <FeeStructureDocumentPreview
                structures={filteredStructures}
                academicYear={structureYearFilter}
                gradeName={grades.find(g => g.id === structureGradeFilter)?.name || ""}
                loading={structuresLoading}
                onDownload={handleDownloadFeeStructure}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-medium text-muted-foreground mb-2">No Fee Structure Selected</h3>
                    <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
                      Please select both academic year and grade above to view the fee structure document
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fee Structure Dialog */}
            <SetFeeStructureDialogEnhanced
              open={editFeeStructureOpen}
              onOpenChange={setEditFeeStructureOpen}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <RecordPaymentDialog
          open={recordPaymentOpen || paymentDialogOpen}
          onOpenChange={(open) => {
            setRecordPaymentOpen(open);
            setPaymentDialogOpen(open);
          }}
          onSuccess={handlePaymentSuccess}
        />

        <GenerateInvoicesDialog
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
          onGenerate={handleGenerateInvoices}
        />

        <MpesaPaymentDialog
          open={mpesaDialogOpen}
          onOpenChange={setMpesaDialogOpen}
          invoiceId={mpesaInvoice?.id}
          learnerId={mpesaInvoice?.learner_id}
          amount={mpesaInvoice?.balance_due}
        />

        {/* Cancel Invoice Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel invoice {invoiceToCancel?.invoice_number}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label>Reason for cancellation</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason..."
              />
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
