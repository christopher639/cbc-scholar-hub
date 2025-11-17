import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, AlertCircle, Download, Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FeeManagement = () => {
  const feeStats = [
    { label: "Total Collected", value: "KES 2,450,000", trend: "+12%", icon: DollarSign },
    { label: "Outstanding", value: "KES 580,000", trend: "-5%", icon: AlertCircle },
    { label: "Collection Rate", value: "81%", trend: "+3%", icon: TrendingUp },
  ];

  const recentPayments = [
    {
      admissionNo: "ADM001",
      name: "John Kamau Mwangi",
      grade: "Grade 4",
      amount: 15000,
      balance: 0,
      date: "2025-01-15",
      method: "MPESA",
    },
    {
      admissionNo: "ADM003",
      name: "David Omondi Otieno",
      grade: "Grade 3",
      amount: 10000,
      balance: 5000,
      date: "2025-01-14",
      method: "Bank",
    },
    {
      admissionNo: "ADM006",
      name: "Sarah Njoki Kariuki",
      grade: "Grade 6",
      amount: 8000,
      balance: 7000,
      date: "2025-01-13",
      method: "Cash",
    },
  ];

  const outstandingBalances = [
    { admissionNo: "ADM001", name: "John Kamau Mwangi", grade: "Grade 4", balance: 15000, lastPayment: "2024-12-10" },
    { admissionNo: "ADM003", name: "David Omondi Otieno", grade: "Grade 3", balance: 8500, lastPayment: "2024-11-20" },
    { admissionNo: "ADM006", name: "Sarah Njoki Kariuki", grade: "Grade 6", balance: 12000, lastPayment: "2024-12-05" },
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
                <p className="text-xs text-muted-foreground">
                  <span className="text-success">{stat.trend}</span> from last term
                </p>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left text-sm font-medium text-muted-foreground">
                        <th className="pb-3 pr-4">Admission No.</th>
                        <th className="pb-3 pr-4">Learner Name</th>
                        <th className="pb-3 pr-4">Grade</th>
                        <th className="pb-3 pr-4">Amount Paid</th>
                        <th className="pb-3 pr-4">Balance</th>
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentPayments.map((payment) => (
                        <tr key={payment.admissionNo} className="text-sm">
                          <td className="py-4 pr-4">
                            <span className="font-mono font-medium text-foreground">{payment.admissionNo}</span>
                          </td>
                          <td className="py-4 pr-4 font-medium text-foreground">{payment.name}</td>
                          <td className="py-4 pr-4 text-foreground">{payment.grade}</td>
                          <td className="py-4 pr-4 font-semibold text-success">
                            KES {payment.amount.toLocaleString()}
                          </td>
                          <td className="py-4 pr-4">
                            {payment.balance > 0 ? (
                              <span className="font-semibold text-warning">KES {payment.balance.toLocaleString()}</span>
                            ) : (
                              <span className="font-semibold text-success">Paid</span>
                            )}
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground">{payment.date}</td>
                          <td className="py-4">
                            <Badge variant="secondary">{payment.method}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left text-sm font-medium text-muted-foreground">
                        <th className="pb-3 pr-4">Admission No.</th>
                        <th className="pb-3 pr-4">Learner Name</th>
                        <th className="pb-3 pr-4">Grade</th>
                        <th className="pb-3 pr-4">Balance</th>
                        <th className="pb-3 pr-4">Last Payment</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {outstandingBalances.map((student) => (
                        <tr key={student.admissionNo} className="text-sm">
                          <td className="py-4 pr-4">
                            <span className="font-mono font-medium text-foreground">{student.admissionNo}</span>
                          </td>
                          <td className="py-4 pr-4 font-medium text-foreground">{student.name}</td>
                          <td className="py-4 pr-4 text-foreground">{student.grade}</td>
                          <td className="py-4 pr-4 font-semibold text-warning">
                            KES {student.balance.toLocaleString()}
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground">{student.lastPayment}</td>
                          <td className="py-4">
                            <Button size="sm" variant="outline">Record Payment</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
