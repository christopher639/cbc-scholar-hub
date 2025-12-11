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
import { User, Phone, Mail, MapPin, Calendar, FileText, TrendingUp, History, ArrowLeft, Edit, ArrowUp, ArrowDown, GraduationCap, Wallet, CreditCard, Clock, BookOpen, Heart, AlertCircle, IdCard } from "lucide-react";
import { PromotionHistoryDialog } from "@/components/PromotionHistoryDialog";
import { EditLearnerDialog } from "@/components/EditLearnerDialog";
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 md:col-span-2" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!learner) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Link to="/learners">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Learners
            </Button>
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Learner Not Found</h2>
              <p className="text-muted-foreground">The learner you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Back Button & Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/learners">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Learner Profile</h1>
              <p className="text-sm sm:text-base text-muted-foreground">View and manage learner information</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setPromotionHistoryOpen(true)} variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button onClick={() => setEditDialogOpen(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {learner.photo_url ? (
                  <img 
                    src={learner.photo_url} 
                    alt={`${learner.first_name} ${learner.last_name}`}
                    className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-xl border-4 border-border shadow-lg mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl border-4 border-border shadow-lg bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-4xl sm:text-5xl font-bold text-primary">
                      {learner.first_name[0]}{learner.last_name[0]}
                    </span>
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {learner.first_name} {learner.last_name}
                </h2>
                <p className="text-muted-foreground mb-3">#{learner.admission_number}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">
                    {learner.current_grade?.name} - {learner.current_stream?.name}
                  </Badge>
                  {learner.status === "alumni" ? (
                    <Badge className="bg-purple-600">Alumni</Badge>
                  ) : (
                    <Badge>Active</Badge>
                  )}
                  {learner.is_staff_child && (
                    <Badge variant="outline">Staff Child</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Cards */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{new Date(learner.date_of_birth).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">({calculateAge(learner.date_of_birth)} years)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium capitalize">{learner.gender}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <GraduationCap className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                    <p className="text-sm font-medium">{new Date(learner.enrollment_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <BookOpen className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Academic Year</p>
                    <p className="text-sm font-medium">{learner.currentAcademicYear || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Clock className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Term</p>
                    <p className="text-sm font-medium">{learner.currentTerm?.replace("_", " ").toUpperCase() || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Wallet className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee Balance</p>
                    <p className={`text-sm font-medium ${(learner.feeInfo?.totalBalance || 0) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(learner.feeInfo?.totalBalance || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Card>
          <Tabs defaultValue="personal" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="personal" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Academic</span>
                </TabsTrigger>
                <TabsTrigger value="fees" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">Fees</span>
                </TabsTrigger>
                <TabsTrigger value="parent" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Parent</span>
                </TabsTrigger>
                {learner.status === "alumni" && (
                  <TabsTrigger value="alumni" className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Alumni</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Personal Info Tab */}
              <TabsContent value="personal" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">First Name</p>
                      <p className="font-medium">{learner.first_name}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Last Name</p>
                      <p className="font-medium">{learner.last_name}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{new Date(learner.date_of_birth).toLocaleDateString()}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{learner.gender}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Admission Number</p>
                      <p className="font-medium">{learner.admission_number}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Enrollment Date</p>
                      <p className="font-medium">{new Date(learner.enrollment_date).toLocaleDateString()}</p>
                    </div>
                    {learner.birth_certificate_number && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Birth Certificate No.</p>
                        <p className="font-medium">{learner.birth_certificate_number}</p>
                      </div>
                    )}
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Boarding Status</p>
                      <p className="font-medium capitalize">{learner.boarding_status || "Day"}</p>
                    </div>
                    {learner.blood_type && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Blood Type</p>
                        <p className="font-medium">{learner.blood_type}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(learner.medical_info || learner.allergies) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Medical Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {learner.medical_info && (
                        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
                          <p className="text-sm text-muted-foreground">Medical Notes</p>
                          <p className="font-medium">{learner.medical_info}</p>
                        </div>
                      )}
                      {learner.allergies && (
                        <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                          <p className="text-sm text-muted-foreground">Allergies</p>
                          <p className="font-medium">{learner.allergies}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(learner.emergency_contact || learner.emergency_phone) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-green-500" />
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {learner.emergency_contact && (
                        <div className="p-4 rounded-lg border">
                          <p className="text-sm text-muted-foreground">Contact Name</p>
                          <p className="font-medium">{learner.emergency_contact}</p>
                        </div>
                      )}
                      {learner.emergency_phone && (
                        <div className="p-4 rounded-lg border">
                          <p className="text-sm text-muted-foreground">Contact Phone</p>
                          <p className="font-medium">{learner.emergency_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(learner.previous_school || learner.previous_grade) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Previous School Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {learner.previous_school && (
                        <div className="p-4 rounded-lg border">
                          <p className="text-sm text-muted-foreground">Previous School</p>
                          <p className="font-medium">{learner.previous_school}</p>
                        </div>
                      )}
                      {learner.previous_grade && (
                        <div className="p-4 rounded-lg border">
                          <p className="text-sm text-muted-foreground">Previous Grade</p>
                          <p className="font-medium">{learner.previous_grade}</p>
                        </div>
                      )}
                      {learner.reason_for_transfer && (
                        <div className="p-4 rounded-lg border sm:col-span-2">
                          <p className="text-sm text-muted-foreground">Reason for Transfer</p>
                          <p className="font-medium">{learner.reason_for_transfer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Academic Tab */}
              <TabsContent value="academic" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Current Grade</p>
                    <Badge variant="secondary" className="mt-1">{learner.current_grade?.name}</Badge>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Current Stream</p>
                    <Badge variant="outline" className="mt-1">{learner.current_stream?.name}</Badge>
                  </div>
                </div>

                {/* Performance Filters */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Records</h3>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term_1">Term 1</SelectItem>
                        <SelectItem value="term_2">Term 2</SelectItem>
                        <SelectItem value="term_3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {learner.performance.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No performance records found</p>
                    </div>
                  ) : (
                    <>
                      {/* Performance Table */}
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Learning Area</TableHead>
                              <TableHead className="text-center">Opener</TableHead>
                              <TableHead className="text-center">Midterm</TableHead>
                              <TableHead className="text-center">Final</TableHead>
                              <TableHead className="text-center">Average</TableHead>
                              <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupPerformanceByArea(learner.performance, learner.performance, selectedAcademicYear, selectedTerm)
                              .filter((row: any) => row.academic_year === selectedAcademicYear && row.term === selectedTerm)
                              .map((row: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{row.learning_area}</TableCell>
                                  <TableCell className="text-center">
                                    {row.opener !== null ? (
                                      <Badge className={getGradeColor(row.opener)}>{row.opener}%</Badge>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {row.midterm !== null ? (
                                      <Badge className={getGradeColor(row.midterm)}>{row.midterm}%</Badge>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {row.final !== null ? (
                                      <Badge className={getGradeColor(row.final)}>{row.final}%</Badge>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {row.average > 0 ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Badge className={getGradeColor(row.average)}>{row.average.toFixed(1)}%</Badge>
                                        {row.deviation !== null && (
                                          row.deviation > 0 ? (
                                            <ArrowUp className="h-3 w-3 text-green-600" />
                                          ) : row.deviation < 0 ? (
                                            <ArrowDown className="h-3 w-3 text-red-600" />
                                          ) : null
                                        )}
                                      </div>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                    {row.remarks || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Performance Chart */}
                      {groupPerformanceByArea(learner.performance, learner.performance, selectedAcademicYear, selectedTerm)
                        .filter((row: any) => row.academic_year === selectedAcademicYear && row.term === selectedTerm).length > 0 && (
                        <div className="h-[300px] mt-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={groupPerformanceByArea(learner.performance, learner.performance, selectedAcademicYear, selectedTerm)
                              .filter((row: any) => row.academic_year === selectedAcademicYear && row.term === selectedTerm)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="learning_area" angle={-45} textAnchor="end" height={100} />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Legend />
                              <Line type="linear" dataKey="opener" stroke="hsl(var(--primary))" strokeWidth={2} name="Opener" />
                              <Line type="linear" dataKey="midterm" stroke="hsl(var(--accent))" strokeWidth={2} name="Mid-Term" />
                              <Line type="linear" dataKey="final" stroke="hsl(var(--secondary))" strokeWidth={2} name="Final" />
                              <Line type="linear" dataKey="average" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Average" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees" className="mt-0 space-y-6">
                {/* Fee Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Accumulated</p>
                        <p className="text-xl font-bold">{formatCurrency(learner.feeInfo?.totalAccumulatedFees || 0)}</p>
                        <p className="text-xs text-muted-foreground">{learner.feeInfo?.allInvoices?.length || 0} invoices</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CreditCard className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(learner.feeInfo?.totalPaid || 0)}</p>
                        <p className="text-xs text-muted-foreground">{learner.feeInfo?.transactions?.length || 0} payments</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <Wallet className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className={`text-xl font-bold ${(learner.feeInfo?.totalBalance || 0) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatCurrency(learner.feeInfo?.totalBalance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Term */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Current Term ({learner.currentAcademicYear} - {learner.currentTerm?.replace("_", " ").toUpperCase()})
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Term Fees</p>
                      <p className="text-lg font-bold">{formatCurrency(learner.feeInfo?.currentTermFees || 0)}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(learner.feeInfo?.currentTermPaid || 0)}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-lg font-bold text-destructive">{formatCurrency(learner.feeInfo?.currentTermBalance || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Invoice History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Invoice History</h3>
                  {learner.feeInfo?.allInvoices && learner.feeInfo.allInvoices.length > 0 ? (
                    <div className="space-y-3">
                      {learner.feeInfo.allInvoices.map((invoice: any, idx: number) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3">
                          <div>
                            <p className="font-medium">{invoice.academic_year} - {invoice.term?.replace("_", " ").toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">Invoice: {invoice.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">
                              Issued: {new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                            <div className="flex gap-2 text-sm">
                              <span className="text-green-600">Paid: {formatCurrency(invoice.amount_paid)}</span>
                              <span className="text-destructive">Due: {formatCurrency(invoice.balance_due)}</span>
                            </div>
                            <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "partial" ? "secondary" : "outline"}>
                              {invoice.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No invoices generated yet</p>
                    </div>
                  )}
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                  {(learner.feeInfo?.transactions?.length > 0 || learner.feeInfo?.feePayments?.length > 0) ? (
                    <div className="space-y-3">
                      {learner.feeInfo.transactions?.map((transaction: any) => (
                        <div key={transaction.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-green-600">+{formatCurrency(transaction.amount_paid)}</p>
                              <Badge variant="outline" className="text-xs">{transaction.transaction_number}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.payment_date).toLocaleDateString()} • {transaction.payment_method}
                            </p>
                            {transaction.receipt_number && (
                              <Badge variant="secondary" className="text-xs">Receipt: {transaction.receipt_number}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {learner.feeInfo.feePayments?.map((payment: any) => (
                        <div key={payment.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-green-600">+{formatCurrency(payment.amount_paid)}</p>
                              {payment.receipt_number && (
                                <Badge variant="outline" className="text-xs">{payment.receipt_number}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString()}
                              {payment.payment_method && ` • ${payment.payment_method}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No payment history available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Parent Tab */}
              <TabsContent value="parent" className="mt-0">
                {!learner.parent ? (
                  <div className="text-center py-12 border rounded-lg">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No parent/guardian information available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{learner.parent.first_name} {learner.parent.last_name}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">Phone Number</span>
                      </div>
                      <p className="font-medium">{learner.parent.phone}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">Email</span>
                      </div>
                      <p className="font-medium">{learner.parent.email}</p>
                    </div>
                    {learner.parent.occupation && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Occupation</p>
                        <p className="font-medium">{learner.parent.occupation}</p>
                      </div>
                    )}
                    {learner.parent.address && (
                      <div className="p-4 rounded-lg border sm:col-span-2">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Address</span>
                        </div>
                        <p className="font-medium">{learner.parent.address}</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Alumni Tab */}
              {learner.status === "alumni" && learner.alumni && learner.alumni.length > 0 && (
                <TabsContent value="alumni" className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                      <p className="text-sm text-muted-foreground">Graduation Year</p>
                      <p className="text-2xl font-bold text-purple-600">{learner.alumni[0].graduation_year}</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Graduation Date</p>
                      <p className="font-medium">{new Date(learner.alumni[0].graduation_date).toLocaleDateString()}</p>
                    </div>
                    {learner.alumni[0].final_grade && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Final Grade</p>
                        <Badge variant="secondary" className="mt-1">{learner.alumni[0].final_grade.name}</Badge>
                      </div>
                    )}
                    {learner.alumni[0].final_stream && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Final Stream</p>
                        <Badge variant="outline" className="mt-1">{learner.alumni[0].final_stream.name}</Badge>
                      </div>
                    )}
                  </div>
                  {learner.alumni[0].notes && (
                    <div className="mt-4 p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-2">Notes</p>
                      <p>{learner.alumni[0].notes}</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
        </Card>

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