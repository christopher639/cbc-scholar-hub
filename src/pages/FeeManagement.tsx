import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, AlertCircle, Download, Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeePayments } from "@/hooks/useFeePayments";
import { useFeeStats } from "@/hooks/useFeeStats";
import { Skeleton } from "@/components/ui/skeleton";

const FeeManagement = () => {
  const { payments, loading: paymentsLoading } = useFeePayments();
  const { stats, loading: statsLoading } = useFeeStats();

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
            <h1 className="text-3xl font-bold text-foreground">Fee Management</h1>
            <p className="text-muted-foreground">Manage school fees, payments, and balances</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button className="gap-2">
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>Latest fee payments received</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        <SelectItem value="1">Grade 1</SelectItem>
                        <SelectItem value="2">Grade 2</SelectItem>
                        <SelectItem value="3">Grade 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                <CardTitle>Fee Structure - Term 1, 2025</CardTitle>
                <CardDescription>Current fee breakdown by grade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"].map((grade) => (
                    <div key={grade} className="border border-border rounded-lg p-4">
                      <h3 className="font-semibold text-foreground mb-3">{grade}</h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tuition Fee:</span>
                          <span className="font-semibold">KES 25,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Activity Fee:</span>
                          <span className="font-semibold">KES 5,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Library Fee:</span>
                          <span className="font-semibold">KES 2,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sports Fee:</span>
                          <span className="font-semibold">KES 3,000</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg col-span-2 pt-2 border-t border-border">
                          <span>Total:</span>
                          <span className="text-primary">KES 35,000</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FeeManagement;
