import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/hooks/useGrades";
import { useStreams } from "@/hooks/useStreams";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAcademicPeriods } from "@/hooks/useAcademicPeriods";
import { useExamTypes } from "@/hooks/useExamTypes";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Unlock, CheckCircle2, Calendar, GraduationCap, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ReleaseMarks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { grades } = useGrades();
  const { streams } = useStreams();
  const { academicYears, currentYear } = useAcademicYears();
  const { currentPeriod } = useAcademicPeriods();
  const { examTypes } = useExamTypes();
  
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  const [releaseForm, setReleaseForm] = useState({
    academicYear: "",
    term: "term_1",
    examType: "",
    scope: "school" as "school" | "grade" | "stream",
    gradeId: "",
    streamId: "",
  });

  const [smsForm, setSmsForm] = useState({
    academicYear: "",
    term: "term_1",
    examType: "",
    scope: "school" as "school" | "grade" | "stream",
    gradeId: "",
    streamId: "",
  });

  // Set defaults from current academic period
  useEffect(() => {
    if (currentYear?.year) {
      setReleaseForm(prev => ({ ...prev, academicYear: currentYear.year }));
      setSmsForm(prev => ({ ...prev, academicYear: currentYear.year }));
    }
    if (currentPeriod?.term) {
      setReleaseForm(prev => ({ ...prev, term: currentPeriod.term }));
      setSmsForm(prev => ({ ...prev, term: currentPeriod.term }));
    }
  }, [currentYear, currentPeriod]);

  // Fetch release history
  const { data: releases = [], isLoading: releasesLoading } = useQuery({
    queryKey: ["performance-releases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_releases")
        .select(`
          *,
          grade:grades(name),
          stream:streams(name)
        `)
        .order("released_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const activeExamTypes = examTypes.filter(et => et.is_active);

  const releaseFilteredStreams = releaseForm.gradeId
    ? streams.filter((stream) => stream.grade_id === releaseForm.gradeId)
    : [];

  const smsFilteredStreams = smsForm.gradeId
    ? streams.filter((stream) => stream.grade_id === smsForm.gradeId)
    : [];

  const handleReleaseMarks = async () => {
    if (!releaseForm.academicYear || !releaseForm.examType) {
      toast({
        title: "Error",
        description: "Please select academic year and exam type",
        variant: "destructive",
      });
      return;
    }

    if (releaseForm.scope === "grade" && !releaseForm.gradeId) {
      toast({
        title: "Error",
        description: "Please select a grade",
        variant: "destructive",
      });
      return;
    }

    if (releaseForm.scope === "stream" && (!releaseForm.gradeId || !releaseForm.streamId)) {
      toast({
        title: "Error",
        description: "Please select both grade and stream",
        variant: "destructive",
      });
      return;
    }

    setReleaseLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if already released
      let query = supabase
        .from("performance_releases")
        .select("id")
        .eq("academic_year", releaseForm.academicYear)
        .eq("term", releaseForm.term)
        .eq("exam_type", releaseForm.examType);

      if (releaseForm.scope === "school") {
        query = query.is("grade_id", null).is("stream_id", null);
      } else if (releaseForm.scope === "grade") {
        query = query.eq("grade_id", releaseForm.gradeId).is("stream_id", null);
      } else {
        query = query.eq("grade_id", releaseForm.gradeId).eq("stream_id", releaseForm.streamId);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        toast({
          title: "Already Released",
          description: "These marks have already been released",
        });
        setReleaseLoading(false);
        return;
      }

      // Create release record
      const { error } = await supabase
        .from("performance_releases")
        .insert({
          academic_year: releaseForm.academicYear,
          term: releaseForm.term,
          exam_type: releaseForm.examType,
          grade_id: releaseForm.scope !== "school" ? releaseForm.gradeId : null,
          stream_id: releaseForm.scope === "stream" ? releaseForm.streamId : null,
          released_by: user.id,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["performance-releases"] });

      toast({
        title: "Success",
        description: "Marks have been released to the learner portal",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleSendPerformanceSms = async () => {
    if (!smsForm.academicYear || !smsForm.examType) {
      toast({
        title: "Error",
        description: "Please select academic year and exam type",
        variant: "destructive",
      });
      return;
    }

    if (smsForm.scope === "grade" && !smsForm.gradeId) {
      toast({
        title: "Error",
        description: "Please select a grade",
        variant: "destructive",
      });
      return;
    }

    if (smsForm.scope === "stream" && (!smsForm.gradeId || !smsForm.streamId)) {
      toast({
        title: "Error",
        description: "Please select both grade and stream",
        variant: "destructive",
      });
      return;
    }

    setSmsLoading(true);

    try {
      const response = await supabase.functions.invoke("send-performance-sms", {
        body: {
          academicYear: smsForm.academicYear,
          term: smsForm.term,
          examType: smsForm.examType,
          scope: smsForm.scope,
          gradeId: smsForm.gradeId || undefined,
          streamId: smsForm.streamId || undefined,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Notice",
          description: result.message || "No messages sent",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send performance SMS",
        variant: "destructive",
      });
    } finally {
      setSmsLoading(false);
    }
  };

  const getTermLabel = (term: string) => {
    const termMap: Record<string, string> = {
      term_1: "Term 1",
      term_2: "Term 2",
      term_3: "Term 3",
    };
    return termMap[term] || term;
  };

  const getScopeLabel = (release: any) => {
    if (release.stream?.name) {
      return `${release.grade?.name} - ${release.stream.name}`;
    }
    if (release.grade?.name) {
      return release.grade.name;
    }
    return "Whole School";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Release Marks</h1>
          <p className="text-muted-foreground">Release performance marks to the learner portal and send SMS notifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Release Marks Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                Release Marks to Portal
              </CardTitle>
              <CardDescription>
                Make performance marks visible to learners on their portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select
                    value={releaseForm.academicYear}
                    onValueChange={(value) => setReleaseForm({ ...releaseForm, academicYear: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.year}>
                          {year.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Term *</Label>
                  <Select
                    value={releaseForm.term}
                    onValueChange={(value) => setReleaseForm({ ...releaseForm, term: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select
                  value={releaseForm.examType}
                  onValueChange={(value) => setReleaseForm({ ...releaseForm, examType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeExamTypes.map((et) => (
                      <SelectItem key={et.id} value={et.name.toLowerCase()}>
                        {et.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Scope *</Label>
                <RadioGroup
                  value={releaseForm.scope}
                  onValueChange={(value: "school" | "grade" | "stream") =>
                    setReleaseForm({ ...releaseForm, scope: value, gradeId: "", streamId: "" })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="school" id="release-school" />
                    <Label htmlFor="release-school" className="cursor-pointer">Whole School</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grade" id="release-grade" />
                    <Label htmlFor="release-grade" className="cursor-pointer">Specific Grade</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stream" id="release-stream" />
                    <Label htmlFor="release-stream" className="cursor-pointer">Specific Stream</Label>
                  </div>
                </RadioGroup>
              </div>

              {(releaseForm.scope === "grade" || releaseForm.scope === "stream") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Grade *</Label>
                    <Select
                      value={releaseForm.gradeId}
                      onValueChange={(value) => setReleaseForm({ ...releaseForm, gradeId: value, streamId: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {releaseForm.scope === "stream" && releaseForm.gradeId && (
                    <div className="space-y-2">
                      <Label>Select Stream *</Label>
                      <Select
                        value={releaseForm.streamId}
                        onValueChange={(value) => setReleaseForm({ ...releaseForm, streamId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a stream" />
                        </SelectTrigger>
                        <SelectContent>
                          {releaseFilteredStreams.map((stream) => (
                            <SelectItem key={stream.id} value={stream.id}>
                              {stream.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleReleaseMarks}
                disabled={releaseLoading}
                className="w-full gap-2"
              >
                {releaseLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
                {releaseLoading ? "Releasing..." : "Release Marks"}
              </Button>
            </CardContent>
          </Card>

          {/* Send SMS Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Performance SMS
              </CardTitle>
              <CardDescription>
                Send performance results to parents via SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select
                    value={smsForm.academicYear}
                    onValueChange={(value) => setSmsForm({ ...smsForm, academicYear: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.year}>
                          {year.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Term *</Label>
                  <Select
                    value={smsForm.term}
                    onValueChange={(value) => setSmsForm({ ...smsForm, term: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term_1">Term 1</SelectItem>
                      <SelectItem value="term_2">Term 2</SelectItem>
                      <SelectItem value="term_3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select
                  value={smsForm.examType}
                  onValueChange={(value) => setSmsForm({ ...smsForm, examType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeExamTypes.map((et) => (
                      <SelectItem key={et.id} value={et.name.toLowerCase()}>
                        {et.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Send To *</Label>
                <RadioGroup
                  value={smsForm.scope}
                  onValueChange={(value: "school" | "grade" | "stream") =>
                    setSmsForm({ ...smsForm, scope: value, gradeId: "", streamId: "" })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="school" id="sms-school" />
                    <Label htmlFor="sms-school" className="cursor-pointer">Whole School</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grade" id="sms-grade" />
                    <Label htmlFor="sms-grade" className="cursor-pointer">Specific Grade</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stream" id="sms-stream" />
                    <Label htmlFor="sms-stream" className="cursor-pointer">Specific Stream</Label>
                  </div>
                </RadioGroup>
              </div>

              {(smsForm.scope === "grade" || smsForm.scope === "stream") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Grade *</Label>
                    <Select
                      value={smsForm.gradeId}
                      onValueChange={(value) => setSmsForm({ ...smsForm, gradeId: value, streamId: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {smsForm.scope === "stream" && smsForm.gradeId && (
                    <div className="space-y-2">
                      <Label>Select Stream *</Label>
                      <Select
                        value={smsForm.streamId}
                        onValueChange={(value) => setSmsForm({ ...smsForm, streamId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a stream" />
                        </SelectTrigger>
                        <SelectContent>
                          {smsFilteredStreams.map((stream) => (
                            <SelectItem key={stream.id} value={stream.id}>
                              {stream.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>SMS Preview:</strong> Parents will receive a message with their learner's average score, grade, and top 3 subjects.
                </p>
              </div>

              <Button
                onClick={handleSendPerformanceSms}
                disabled={smsLoading}
                className="w-full gap-2"
              >
                {smsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {smsLoading ? "Sending..." : "Send Performance SMS"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Release History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Release History
            </CardTitle>
            <CardDescription>
              All performance releases made to the learner portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {releasesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : releases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No marks have been released yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Exam Type</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Released At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {releases.map((release: any) => (
                      <TableRow key={release.id}>
                        <TableCell className="font-medium">{release.academic_year}</TableCell>
                        <TableCell>{getTermLabel(release.term)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{release.exam_type}</Badge>
                        </TableCell>
                        <TableCell>{getScopeLabel(release)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(release.released_at), "PPp")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}