import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, DollarSign, TrendingUp, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";

export default function LearnerDashboard() {
  const { learnerDetails } = useOutletContext<any>();
  const { user } = useAuth();
  const learner = user?.data;
  const [stats, setStats] = useState({
    totalSubjects: 0,
    averageScore: 0,
    feeBalance: 0,
  });
  const [performance, setPerformance] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [feeInfo, setFeeInfo] = useState({
    totalAccumulatedFees: 0,
    totalPaid: 0,
    totalBalance: 0,
    currentTermFees: 0,
    currentTermPaid: 0,
    currentTermBalance: 0,
  });

  useEffect(() => {
    if (learner) {
      fetchStats();
    }
  }, [learner]);

  const fetchStats = async () => {
    if (!learner) return;

    // Fetch performance records with details
    const { data: performanceData } = await supabase
      .from("performance_records")
      .select(`
        *,
        learning_area:learning_areas(name),
        academic_period:academic_periods(academic_year, term)
      `)
      .eq("learner_id", learner.id)
      .order("created_at", { ascending: false });

    setPerformance(performanceData || []);

    // Fetch invoices with details
    const { data: invoicesData } = await supabase
      .from("student_invoices")
      .select("*")
      .eq("learner_id", learner.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    setInvoices(invoicesData || []);

    // Fetch transactions
    const { data: transactionsData } = await supabase
      .from("fee_transactions")
      .select("*")
      .eq("learner_id", learner.id)
      .order("payment_date", { ascending: false });

    setTransactions(transactionsData || []);

    // Calculate stats
    const avgScore = performanceData?.length
      ? performanceData.reduce((sum, p) => sum + Number(p.marks), 0) / performanceData.length
      : 0;

    const totalAccumulated = invoicesData?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
    const totalPaid = transactionsData?.reduce((sum, t) => sum + Number(t.amount_paid), 0) || 0;
    const totalBalance = invoicesData?.reduce((sum, inv) => sum + Number(inv.balance_due), 0) || 0;

    // Get current academic period
    const { data: currentPeriod } = await supabase
      .from("academic_periods")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();

    let currentTermFees = 0;
    let currentTermPaid = 0;
    if (currentPeriod && invoicesData) {
      const currentInvoice = invoicesData.find(
        inv => inv.academic_year === currentPeriod.academic_year && inv.term === currentPeriod.term
      );
      if (currentInvoice) {
        currentTermFees = Number(currentInvoice.total_amount);
        currentTermPaid = Number(currentInvoice.amount_paid);
      }
    }

    // Count unique learning areas
    const subjectCount = performanceData 
      ? new Set(performanceData.map(p => p.learning_area_id)).size 
      : 0;

    setStats({
      totalSubjects: subjectCount,
      averageScore: Math.round(avgScore),
      feeBalance: totalBalance,
    });

    setFeeInfo({
      totalAccumulatedFees: totalAccumulated,
      totalPaid,
      totalBalance,
      currentTermFees,
      currentTermPaid,
      currentTermBalance: currentTermFees - currentTermPaid,
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 80) return "bg-green-100 text-green-800";
    if (marks >= 70) return "bg-blue-100 text-blue-800";
    if (marks >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={learnerDetails?.photo_url} alt={`${learnerDetails?.first_name} ${learnerDetails?.last_name}`} />
              <AvatarFallback className="text-3xl">
                {learnerDetails?.first_name?.[0]}{learnerDetails?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {learnerDetails?.first_name} {learnerDetails?.last_name}
                </h1>
                <p className="text-muted-foreground">Admission No: {learnerDetails?.admission_number}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-base">
                  {learnerDetails?.current_grade?.name} {learnerDetails?.current_stream?.name}
                </Badge>
                <Badge className="text-base">Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Born: {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"} ({learnerDetails?.date_of_birth ? calculateAge(learnerDetails.date_of_birth) : 0} years)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="capitalize">{learnerDetails?.gender}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Enrolled: {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              From {stats.totalSubjects} subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(feeInfo.totalAccumulatedFees)}</div>
            <p className="text-xs text-muted-foreground mt-2">Accumulated fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(feeInfo.totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-2">{transactions.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(feeInfo.totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-2">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base font-medium">{learnerDetails?.first_name} {learnerDetails?.last_name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-base font-medium">
                    {learnerDetails?.date_of_birth ? new Date(learnerDetails.date_of_birth).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="text-base font-medium capitalize">{learnerDetails?.gender}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                  <p className="text-base font-medium">{learnerDetails?.admission_number}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Grade</p>
                  <p className="text-base font-medium">{learnerDetails?.current_grade?.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Stream</p>
                  <p className="text-base font-medium">{learnerDetails?.current_stream?.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Boarding Status</p>
                  <p className="text-base font-medium capitalize">
                    {learnerDetails?.boarding_status?.replace("_", " ")}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
                  <p className="text-base font-medium">
                    {learnerDetails?.enrollment_date ? new Date(learnerDetails.enrollment_date).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {(learnerDetails?.emergency_contact || learnerDetails?.emergency_phone) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                        <p className="text-base font-medium">{learnerDetails?.emergency_contact || "Not set"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                        <p className="text-base font-medium">{learnerDetails?.emergency_phone || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>Your assessment results across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {performance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No performance records found</p>
              ) : (
                <div className="space-y-3">
                  {performance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{record.learning_area?.name}</p>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>{record.academic_period?.academic_year}</span>
                          {record.academic_period?.term && (
                            <span>• {record.academic_period.term.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                          )}
                          {record.exam_type && <span>• {record.exam_type}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-base ${getGradeColor(record.marks)}`}>
                            {record.grade_letter || 'N/A'}
                          </Badge>
                          <span className="text-2xl font-bold">{record.marks}%</span>
                        </div>
                        {record.remarks && (
                          <p className="text-xs text-muted-foreground mt-1">{record.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          {/* Fee Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Fee Summary
              </CardTitle>
              <CardDescription>Your complete fee information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm text-muted-foreground mb-1">Total Fees</p>
                  <p className="text-2xl font-bold">{formatCurrency(feeInfo.totalAccumulatedFees)}</p>
                  <p className="text-xs text-muted-foreground mt-1">From {invoices.length} invoices</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(feeInfo.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{transactions.length} payments</p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <p className="text-sm text-muted-foreground mb-1">Balance Due</p>
                  <p className={`text-2xl font-bold ${feeInfo.totalBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(feeInfo.totalBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Term Fees */}
          <Card>
            <CardHeader>
              <CardTitle>Current Term Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Term Fees</p>
                  <p className="text-xl font-bold">{formatCurrency(feeInfo.currentTermFees)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(feeInfo.currentTermPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(feeInfo.currentTermBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No invoices found</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {invoice.academic_year} - {invoice.term?.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">Invoice: {invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          Issued: {new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(invoice.total_amount)}</p>
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{formatCurrency(transaction.amount_paid)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.payment_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.payment_method} • {transaction.transaction_number}
                        </p>
                      </div>
                      <Badge variant="outline">Paid</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
