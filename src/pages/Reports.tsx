import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Users, DollarSign, TrendingUp, GraduationCap, Calendar } from "lucide-react";

const Reports = () => {
  const [timePeriod, setTimePeriod] = useState("current-term");
  const [academicYear, setAcademicYear] = useState("2024-2025");

  const reportCategories = [
    {
      title: "Learner Reports",
      icon: Users,
      reports: [
        { name: "Learner Population Report", description: "Complete breakdown by grade and stream" },
        { name: "Learner Demographics", description: "Gender distribution and statistics" },
        { name: "Learner Attendance Report", description: "Monthly attendance tracking" },
        { name: "Alumni Database", description: "Graduated learners listing" },
      ],
    },
    {
      title: "Fee Reports",
      icon: DollarSign,
      reports: [
        { name: "Fee Collection Summary", description: "Total collections and outstanding balances" },
        { name: "Discount Analysis", description: "Staff, sibling, and bursary discounts" },
        { name: "Payment Method Analysis", description: "Breakdown by payment channels" },
        { name: "Balance Outstanding Report", description: "Learners with pending payments" },
      ],
    },
    {
      title: "Academic Reports",
      icon: GraduationCap,
      reports: [
        { name: "Grade Distribution", description: "Learner count per grade and stream" },
        { name: "Promotion History", description: "Learner progression tracking" },
        { name: "Transfer Records", description: "Inter-stream transfer history" },
        { name: "Staff Children Report", description: "Learners with staff parents" },
      ],
    },
    {
      title: "Administrative Reports",
      icon: TrendingUp,
      reports: [
        { name: "Sibling Relationships", description: "Families with multiple learners" },
        { name: "Admission Trends", description: "New admissions over time" },
        { name: "Stream Capacity Analysis", description: "Occupancy rates by stream" },
        { name: "Annual Summary Report", description: "Comprehensive yearly overview" },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate comprehensive reports for decision making</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>

        {/* Time Period Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Analytics Time Period
            </CardTitle>
            <CardDescription>Select the time range for generating reports and viewing analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timePeriod">Time Period</Label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger id="timePeriod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-term">Current Term</SelectItem>
                    <SelectItem value="current-year">Current Academic Year</SelectItem>
                    <SelectItem value="last-term">Last Term</SelectItem>
                    <SelectItem value="last-year">Last Academic Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger id="academicYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024/2025</SelectItem>
                    <SelectItem value="2023-2024">2023/2024</SelectItem>
                    <SelectItem value="2022-2023">2022/2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">Apply Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Reports</CardDescription>
              <CardTitle className="text-3xl">16</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Available report types</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">42</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Reports generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Most Used</CardDescription>
              <CardTitle className="text-xl">Fee Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">24 times this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Last Generated</CardDescription>
              <CardTitle className="text-xl">2 hours ago</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Learner Population</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Categories */}
        <div className="grid gap-6 md:grid-cols-2">
          {reportCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-primary" />
                  <CardTitle>{category.title}</CardTitle>
                </div>
                <CardDescription>{category.reports.length} available reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.reports.map((report) => (
                    <div
                      key={report.name}
                      className="flex items-start justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <h4 className="font-medium text-foreground text-sm">{report.name}</h4>
                          <p className="text-xs text-muted-foreground">{report.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Report Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Report Builder</CardTitle>
            <CardDescription>Create customized reports with specific parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Use the custom report builder to create tailored reports
                <br />
                with specific date ranges, filters, and data points
              </p>
              <Button>Launch Report Builder</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
