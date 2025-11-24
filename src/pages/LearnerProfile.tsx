import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Phone, Mail, MapPin, Calendar, FileText, DollarSign, TrendingUp, History, ArrowLeft, Edit, UserX, ArrowUp, ArrowDown } from "lucide-react";
import { PromotionHistoryDialog } from "@/components/PromotionHistoryDialog";
import { EditLearnerDialog } from "@/components/EditLearnerDialog";
import { TransferLearnerDialog } from "@/components/TransferLearnerDialog";
import { useLearnerDetail } from "@/hooks/useLearnerDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LearnerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [promotionHistoryOpen, setPromotionHistoryOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const { learner, loading, refetch } = useLearnerDetail(id || "");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("term_1");

  // Fetch available academic years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('year')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data.map(y => y.year);
    }
  });

  // Group performance records by learning area with deviation calculation
  const groupPerformanceByArea = (records: any[], allRecords: any[], currentYear: string, currentTerm: string) => {
    const grouped = records.reduce((acc: any, record: any) => {
      const areaName = record.learning_area?.name || "Unknown";
      const key = `${areaName}-${record.academic_year}-${record.term}`;
      
      if (!acc[key]) {
        acc[key] = {
          learning_area: areaName,
          academic_year: record.academic_year,
          term: record.term,
          opener: null,
          midterm: null,
          final: null,
          remarks: null,
        };
      }
      
      if (record.exam_type === "opener") {
        acc[key].opener = record.marks;
        if (record.remarks) acc[key].remarks = record.remarks;
      }
      if (record.exam_type === "midterm") {
        acc[key].midterm = record.marks;
        if (record.remarks) acc[key].remarks = record.remarks;
      }
      if (record.exam_type === "final") {
        acc[key].final = record.marks;
        if (record.remarks) acc[key].remarks = record.remarks;
      }
      
      return acc;
    }, {});

    // Calculate previous term average for each learning area
    const getPreviousTerm = (term: string) => {
      if (term === "term_3") return "term_2";
      if (term === "term_2") return "term_1";
      return null;
    };
    
    const previousTerm = getPreviousTerm(currentTerm);
    const previousTermRecords = previousTerm 
      ? allRecords.filter((r: any) => r.academic_year === currentYear && r.term === previousTerm)
      : [];
    
    const previousAverages: Record<string, any> = {};
    previousTermRecords.forEach((record: any) => {
      const areaName = record.learning_area?.name || "Unknown";
      if (!previousAverages[areaName]) {
        previousAverages[areaName] = { total: 0, count: 0 };
      }
      previousAverages[areaName].total += Number(record.marks);
      previousAverages[areaName].count += 1;
    });
    
    Object.keys(previousAverages).forEach(area => {
      previousAverages[area] = previousAverages[area].total / previousAverages[area].count;
    });

    return Object.values(grouped).map((row: any) => {
      const scores = [row.opener, row.midterm, row.final].filter((s: any) => s !== null);
      const average = scores.length > 0 
        ? Math.round((scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length) * 10) / 10
        : 0;
      
      const previousAverage = previousAverages[row.learning_area];
      const deviation = average > 0 && previousAverage 
        ? Math.round((average - previousAverage) * 10) / 10 
        : null;
      
      return { 
        ...row, 
        average,
        deviation,
        previousAverage: previousAverage ? Math.round(previousAverage) : null
      };
    });
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (marks >= 60) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (marks >= 50) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  const getTermLabel = (term: string) => {
    const termMap: Record<string, string> = {
      term_1: "Term 1",
      term_2: "Term 2",
      term_3: "Term 3",
    };
    return termMap[term] || term;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!learner) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Learner not found</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link to="/learners">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Learners
          </Button>
        </Link>

        {/* Header Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Large Square Profile Image */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative w-48 h-48 lg:w-56 lg:h-56">
                  {learner.photo_url ? (
                    <img 
                      src={learner.photo_url} 
                      alt={`${learner.first_name} ${learner.last_name}`}
                      className="w-full h-full object-cover rounded-lg border-4 border-border shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg border-4 border-border shadow-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-6xl font-bold text-primary">
                        {learner.first_name[0]}{learner.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Primary Information */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {learner.first_name} {learner.last_name}
                  </h1>
                  <p className="text-muted-foreground">Admission No: {learner.admission_number}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-base">
                    {learner.current_grade?.name} {learner.current_stream?.name}
                  </Badge>
                  {learner.status === "alumni" ? (
                    <Badge variant="default" className="text-base bg-purple-600">Alumni</Badge>
                  ) : (
                    <Badge className="text-base">Active</Badge>
                  )}
                  {learner.is_staff_child && (
                    <Badge variant="outline" className="text-base">Staff Child</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Born: {new Date(learner.date_of_birth).toLocaleDateString()} ({calculateAge(learner.date_of_birth)} years)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="capitalize">{learner.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Enrolled: {new Date(learner.enrollment_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Academic & Action Buttons */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                    <p className="text-base font-semibold text-foreground">{learner.currentAcademicYear || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Current Term</p>
                    <p className="text-base font-semibold text-foreground">{learner.currentTerm?.replace("_", " ").toUpperCase() || "N/A"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button onClick={() => setPromotionHistoryOpen(true)} variant="outline" className="w-full gap-2">
                    <History className="h-4 w-4" />
                    View Promotion History
                  </Button>
                  <Button onClick={() => setEditDialogOpen(true)} className="w-full gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Information
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="parent">Parent/Guardian</TabsTrigger>
            {learner.status === "alumni" && (
              <TabsTrigger value="alumni">Alumni Info</TabsTrigger>
            )}
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">First Name</p>
                    <p className="text-base font-medium">{learner.first_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                    <p className="text-base font-medium">{learner.last_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-base font-medium">{new Date(learner.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="text-base font-medium capitalize">{learner.gender}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                    <p className="text-base font-medium">{learner.admission_number}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
                    <p className="text-base font-medium">{new Date(learner.enrollment_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {learner.medical_info && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Medical Information</p>
                      <p className="text-base">{learner.medical_info}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Grade</p>
                    <Badge variant="secondary" className="text-base">{learner.current_grade?.name}</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Stream</p>
                    <Badge variant="outline" className="text-base">{learner.current_stream?.name}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Records */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Performance Records</CardTitle>
                    <CardDescription>Academic performance by learning area</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {learner.performance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No performance records found</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Learning Area</TableHead>
                            <TableHead className="hidden md:table-cell">Year/Term</TableHead>
                            <TableHead className="text-center">Opener</TableHead>
                            <TableHead className="text-center">Midterm</TableHead>
                            <TableHead className="text-center">Final</TableHead>
                            <TableHead className="text-center font-semibold">Average</TableHead>
                            <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupPerformanceByArea(learner.performance, learner.performance, selectedAcademicYear, selectedTerm).filter((row: any) => 
                            row.academic_year === selectedAcademicYear && row.term === selectedTerm
                          ).map((row: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{row.learning_area}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {row.academic_year} / {getTermLabel(row.term)}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.opener !== null ? (
                                  <Badge className={getGradeColor(row.opener)}>{row.opener}%</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.midterm !== null ? (
                                  <Badge className={getGradeColor(row.midterm)}>{row.midterm}%</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.final !== null ? (
                                  <Badge className={getGradeColor(row.final)}>{row.final}%</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.average > 0 ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Badge variant="default" className={getGradeColor(row.average)}>
                                      {row.average.toFixed(1)}%
                                    </Badge>
                                    {row.deviation !== null && (
                                      <div className="flex items-center">
                                        {row.deviation > 0 ? (
                                          <ArrowUp className="h-3 w-3 text-green-600" />
                                        ) : row.deviation < 0 ? (
                                          <ArrowDown className="h-3 w-3 text-red-600" />
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                {row.remarks || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Overview Graph */}
                    {groupPerformanceByArea(learner.performance, learner.performance, selectedAcademicYear, selectedTerm).filter((row: any) => 
                      row.academic_year === selectedAcademicYear && row.term === selectedTerm
                    ).length > 0 && (
                      <div className="h-[300px] mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={groupPerformanceByArea(learner.performance, learner.performance, selectedAcademicYear, selectedTerm).filter((row: any) => 
                            row.academic_year === selectedAcademicYear && row.term === selectedTerm
                          )}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="learning_area" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="linear" 
                              dataKey="opener" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              name="Opener"
                            />
                            <Line 
                              type="linear" 
                              dataKey="midterm" 
                              stroke="hsl(var(--accent))" 
                              strokeWidth={2}
                              name="Mid-Term"
                            />
                            <Line 
                              type="linear" 
                              dataKey="final" 
                              stroke="hsl(var(--secondary))" 
                              strokeWidth={2}
                              name="Final"
                            />
                            <Line 
                              type="linear" 
                              dataKey="average" 
                              stroke="hsl(var(--chart-1))" 
                              strokeWidth={2}
                              name="Average"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            {/* Cumulative Fees Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Fee Summary - Admission #{learner.admission_number}
                </CardTitle>
                <CardDescription>
                  Fees accumulate as new invoices are generated each term
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total Accumulated Fees</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(learner.feeInfo?.totalAccumulatedFees || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {learner.feeInfo?.allInvoices?.length || 0} invoices
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount Paid</p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(learner.feeInfo?.totalPaid || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {learner.feeInfo?.transactions?.length || 0} payments recorded
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Outstanding Balance</p>
                    <p className={`text-2xl font-bold ${(learner.feeInfo?.totalBalance || 0) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(learner.feeInfo?.totalBalance || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accumulated - Paid
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Term Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Current Term Fees</CardTitle>
                <CardDescription>
                  {learner.currentAcademicYear} - {learner.currentTerm?.replace("_", " ").toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Term Fees</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(learner.feeInfo?.currentTermFees || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(learner.feeInfo?.currentTermPaid || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-xl font-bold text-destructive">
                      {formatCurrency(learner.feeInfo?.currentTermBalance || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Invoices History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice History
                </CardTitle>
                <CardDescription>
                  As learner progresses through terms and grades, invoices accumulate for admission #{learner.admission_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {learner.feeInfo?.allInvoices && learner.feeInfo.allInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {learner.feeInfo.allInvoices.map((invoice: any, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-border rounded-lg bg-card gap-2 hover:bg-accent/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {invoice.academic_year} - {invoice.term?.replace("_", " ").toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Invoice: {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Issued: {new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-semibold text-lg text-foreground">
                            {formatCurrency(invoice.total_amount)}
                          </p>
                          <p className="text-sm text-success">
                            Paid: {formatCurrency(invoice.amount_paid)}
                          </p>
                          <p className="text-sm text-destructive">
                            Balance: {formatCurrency(invoice.balance_due)}
                          </p>
                          <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "partial" ? "secondary" : "outline"}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">Total from all invoices:</span>
                        <span className="text-xl font-bold text-foreground">
                          {formatCurrency(learner.feeInfo?.totalAccumulatedFees || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No invoices generated yet</p>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  All payments recorded for admission #{learner.admission_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(learner.feeInfo?.transactions?.length > 0 || learner.feeInfo?.feePayments?.length > 0) ? (
                  <div className="space-y-3">
                    {/* Fee Transactions (New System) */}
                    {learner.feeInfo.transactions?.map((transaction: any) => (
                      <div key={transaction.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-border rounded-lg bg-card gap-2 hover:bg-accent/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg text-success">+{formatCurrency(transaction.amount_paid)}</p>
                            <Badge variant="outline" className="text-xs">{transaction.transaction_number}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.payment_date).toLocaleDateString()} • {transaction.payment_method}
                          </p>
                          {transaction.invoice && (
                            <p className="text-xs text-muted-foreground">
                              Invoice: {transaction.invoice.invoice_number} ({transaction.invoice.academic_year} - {transaction.invoice.term?.replace("_", " ").toUpperCase()})
                            </p>
                          )}
                          {transaction.reference_number && (
                            <p className="text-xs text-muted-foreground">Ref: {transaction.reference_number}</p>
                          )}
                          {transaction.receipt_number && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Receipt: {transaction.receipt_number}
                            </Badge>
                          )}
                          {transaction.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">{transaction.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Legacy Fee Payments */}
                    {learner.feeInfo.feePayments?.map((payment: any) => (
                      <div key={payment.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-border rounded-lg bg-card gap-2 hover:bg-accent/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg text-success">+{formatCurrency(payment.amount_paid)}</p>
                            {payment.receipt_number && (
                              <Badge variant="outline" className="text-xs">{payment.receipt_number}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                            {payment.payment_method && ` • ${payment.payment_method}`}
                          </p>
                          {payment.fee_structure && (
                            <p className="text-xs text-muted-foreground">
                              {payment.fee_structure.academic_year} - {payment.fee_structure.term?.replace("_", " ").toUpperCase()}
                            </p>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">Total Payments Made:</span>
                        <span className="text-xl font-bold text-success">
                          {formatCurrency(learner.feeInfo?.totalPaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No payment history available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parent/Guardian Tab */}
          <TabsContent value="parent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
              </CardHeader>
              <CardContent>
                {!learner.parent ? (
                  <p className="text-center text-muted-foreground py-8">No parent/guardian information available</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="text-base font-medium">{learner.parent.first_name} {learner.parent.last_name}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base font-medium">{learner.parent.phone}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base font-medium">{learner.parent.email}</p>
                        </div>
                      </div>
                      {learner.parent.occupation && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                          <p className="text-base font-medium">{learner.parent.occupation}</p>
                        </div>
                      )}
                    </div>
                    {learner.parent.address && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Address</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <p className="text-base">{learner.parent.address}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alumni Info Tab */}
          {learner.status === "alumni" && learner.alumni && learner.alumni.length > 0 && (
            <TabsContent value="alumni" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alumni Information</CardTitle>
                  <CardDescription>Graduation details and records</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Graduation Year</p>
                      <p className="text-2xl font-bold text-purple-600">{learner.alumni[0].graduation_year}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Graduation Date</p>
                      <p className="text-base font-medium">{new Date(learner.alumni[0].graduation_date).toLocaleDateString()}</p>
                    </div>
                    {learner.alumni[0].final_grade && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Final Grade</p>
                        <Badge variant="secondary" className="text-base">
                          {learner.alumni[0].final_grade.name}
                        </Badge>
                      </div>
                    )}
                    {learner.alumni[0].final_stream && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Final Stream</p>
                        <Badge variant="outline" className="text-base">
                          {learner.alumni[0].final_stream.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {learner.alumni[0].notes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-base">{learner.alumni[0].notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <PromotionHistoryDialog
          open={promotionHistoryOpen}
          onOpenChange={setPromotionHistoryOpen}
          learnerName={`${learner.first_name} ${learner.last_name}`}
          promotionHistory={learner.promotionHistory}
        />
        
        <EditLearnerDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          learner={learner}
          onSuccess={refetch}
        />
      </div>
    </DashboardLayout>
  );
};

export default LearnerProfile;
