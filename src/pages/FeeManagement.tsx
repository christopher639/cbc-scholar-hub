import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DollarSign, TrendingUp, AlertCircle, Download, Plus, Calendar } from "lucide-react";
import { useFeePayments } from "@/hooks/useFeePayments";
import { useFeeStats } from "@/hooks/useFeeStats";
import { useFeeStructures } from "@/hooks/useFeeStructures";
import { Skeleton } from "@/components/ui/skeleton";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const FeeManagement = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const { payments, loading: paymentsLoading, fetchPayments } = useFeePayments();
  const { stats, trendData, loading: statsLoading, fetchStats } = useFeeStats(dateRange.start, dateRange.end);
  const { structures, loading: structuresLoading } = useFeeStructures();
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  

  const handlePaymentSuccess = () => {
    fetchPayments();
    fetchStats();
  };

  const feeStats = [
    { 
      label: "Total Collected", 
      value: statsLoading ? "..." : `KES ${(stats.totalCollected / 1000).toFixed(1)}K`,
      icon: DollarSign 
    },
    { 
      label: "Outstanding", 
      value: statsLoading ? "..." : `KES ${(stats.outstanding / 1000).toFixed(1)}K`,
      icon: AlertCircle 
    },
    { 
      label: "Collection Rate", 
      value: statsLoading ? "..." : `${stats.collectionRate.toFixed(0)}%`,
      icon: TrendingUp 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Fee Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage school fees, payments, and balances</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateRange.start && dateRange.end
                    ? `${format(dateRange.start, "PP")} - ${format(dateRange.end, "PP")}`
                    : "Filter by Date"}
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
            <Button variant="outline" className="gap-2" onClick={() => navigate("/academic-years")}>
              <Calendar className="h-4 w-4" />
              Academic Years
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2" onClick={() => setRecordPaymentOpen(true)}>
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {feeStats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fee Payment Trend Graph */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Payment Trend</CardTitle>
            <CardDescription>
              Daily fee payments {dateRange.start && dateRange.end ? `from ${format(dateRange.start, "PP")} to ${format(dateRange.end, "PP")}` : "over time"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : trendData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No payment data available for the selected period
              </div>
            ) : (
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--success))",
                  },
                }}
                className="h-[300px]"
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
                      tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}K`}
                      className="text-xs"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => format(new Date(value), "PPP")}
                          formatter={(value) => `KES ${Number(value).toLocaleString()}`}
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

        {/* Main Content */}
        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Recent Payments</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding Balances</TabsTrigger>
            <TabsTrigger value="structure">Fee Structure</TabsTrigger>
          </TabsList>

          {/* Recent Payments */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest fee payments received</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No payments recorded yet</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record First Payment
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr className="text-left text-sm font-medium text-muted-foreground">
                          <th className="pb-3 pr-4">Admission No.</th>
                          <th className="pb-3 pr-4">Learner Name</th>
                          <th className="pb-3 pr-4">Grade</th>
                          <th className="pb-3 pr-4">Amount Paid</th>
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {payments.slice(0, 10).map((payment: any) => (
                          <tr key={payment.id} className="text-sm">
                            <td className="py-4 pr-4">
                              <span className="font-mono font-medium text-foreground">
                                {payment.learner?.admission_number || 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 pr-4 font-medium text-foreground">
                              {payment.learner?.first_name} {payment.learner?.last_name}
                            </td>
                            <td className="py-4 pr-4 text-foreground">
                              {payment.learner?.current_grade?.name || 'N/A'}
                            </td>
                            <td className="py-4 pr-4 font-semibold text-success">
                              KES {Number(payment.amount_paid).toLocaleString()}
                            </td>
                            <td className="py-4 pr-4 text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <Badge variant="secondary">{payment.payment_method || 'Cash'}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outstanding Balances */}
          <TabsContent value="outstanding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Balances</CardTitle>
                <CardDescription>Learners with pending fee payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Outstanding balances feature coming soon</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Structure */}
          <TabsContent value="structure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>Current fee breakdown by grade</CardDescription>
              </CardHeader>
              <CardContent>
                {structuresLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : structures.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No fee structures set yet</p>
                    <Button onClick={() => navigate("/fee-structures")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Fee Structure
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      // Group structures by grade
                      const gradeGroups: { [key: string]: any[] } = {};
                      structures.forEach((structure) => {
                        const gradeName = structure.grade?.name || 'Unknown Grade';
                        if (!gradeGroups[gradeName]) {
                          gradeGroups[gradeName] = [];
                        }
                        gradeGroups[gradeName].push(structure);
                      });

                      return Object.entries(gradeGroups).map(([gradeName, gradeStructures]) => {
                        const total = gradeStructures.reduce((sum, s) => sum + Number(s.amount), 0);
                        return (
                          <div key={gradeName} className="border border-border rounded-lg p-4">
                            <h3 className="font-semibold text-foreground mb-3">{gradeName}</h3>
                            <div className="grid gap-2 md:grid-cols-2">
                              {gradeStructures.map((structure) => (
                                <div key={structure.id} className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    {structure.category?.name || structure.description || 'Fee'}:
                                  </span>
                                  <span className="font-semibold">
                                    KES {Number(structure.amount).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between font-bold text-lg col-span-2 pt-2 border-t border-border">
                                <span>Total:</span>
                                <span className="text-primary">KES {total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <RecordPaymentDialog
          open={recordPaymentOpen}
          onOpenChange={setRecordPaymentOpen}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </DashboardLayout>
  );
};

export default FeeManagement;

